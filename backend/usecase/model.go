package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/rag"
	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
)

type ModelUsecase struct {
	modelRepo *pg.ModelRepository
	logger    *log.Logger
	config    *config.Config
	nodeRepo  *pg.NodeRepository
	ragRepo   *mq.RAGRepository
	ragStore  rag.RAGService
	kbRepo    *pg.KnowledgeBaseRepository
}

func NewModelUsecase(modelRepo *pg.ModelRepository, nodeRepo *pg.NodeRepository, ragRepo *mq.RAGRepository, ragStore rag.RAGService, logger *log.Logger, config *config.Config, kbRepo *pg.KnowledgeBaseRepository) *ModelUsecase {
	u := &ModelUsecase{
		modelRepo: modelRepo,
		logger:    logger.WithModule("usecase.model"),
		config:    config,
		nodeRepo:  nodeRepo,
		ragRepo:   ragRepo,
		ragStore:  ragStore,
		kbRepo:    kbRepo,
	}
	if err := u.initEmbeddingAndRerankModel(context.Background()); err != nil {
		logger.Error("init embedding & rerank & analysis model failed", log.Any("error", err))
	}
	return u
}

func (u *ModelUsecase) initEmbeddingAndRerankModel(ctx context.Context) error {
	isReady := false
	// wait for raglite to be ready
	for range 60 {
		models, err := u.ragStore.GetModelList(ctx)
		if err != nil {
			u.logger.Error("wait for raglite to be ready", log.Any("error", err))
			time.Sleep(1 * time.Second)
			continue
		}
		isReady = true
		if len(models) > 0 {
			// init analysis model for old user
			hasAnalysis := false
			for _, m := range models {
				if m.Type == domain.ModelTypeAnalysis {
					hasAnalysis = true
					break
				}
			}
			if !hasAnalysis {
				if err := u.createAndSyncModelToRAGLite(ctx, "qwen2.5-3b-instruct", domain.ModelTypeAnalysis); err != nil {
					return fmt.Errorf("add analysis model err: %v", err)
				}
			}
			return nil
		} else {
			break
		}
	}
	if !isReady {
		return fmt.Errorf("raglite is not ready")
	}

	if err := u.createAndSyncModelToRAGLite(ctx, "bge-m3", domain.ModelTypeEmbedding); err != nil {
		return fmt.Errorf("create and sync model err: %v", err)
	}
	if err := u.createAndSyncModelToRAGLite(ctx, "bge-reranker-v2-m3", domain.ModelTypeRerank); err != nil {
		return fmt.Errorf("create and sync model err: %v", err)
	}
	if err := u.createAndSyncModelToRAGLite(ctx, "qwen2.5-3b-instruct", domain.ModelTypeAnalysis); err != nil {
		return fmt.Errorf("create and sync model err: %v", err)
	}
	return nil
}

func (u *ModelUsecase) createAndSyncModelToRAGLite(ctx context.Context, modelName string, modelType domain.ModelType) error {
	// FIXME: just for test, remove it later
	// shared_key by BaiZhiCloud
	sharedKey := "sk-r8tmBtcU1JotPDPnlgZLOY4Z6Dbb7FufcSeTkFpRWA5v4Llr"
	baseURL := "https://model-square.app.baizhi.cloud/v1"
	model := &domain.Model{
		ID:         uuid.New().String(),
		Provider:   domain.ModelProviderBrandBaiZhiCloud,
		Model:      modelName,
		APIKey:     sharedKey,
		APIHeader:  "",
		BaseURL:    baseURL,
		IsActive:   true,
		APIVersion: "",
		Type:       modelType,
	}
	id, err := u.ragStore.AddModel(ctx, model)
	if err != nil {
		return fmt.Errorf("init %s model failed: %w", modelName, err)
	}
	model.ID = id
	if err := u.modelRepo.Create(ctx, model); err != nil {
		return fmt.Errorf("create %s model failed: %w", modelName, err)
	}
	return nil
}

func (u *ModelUsecase) Create(ctx context.Context, model *domain.Model) error {
	if err := u.modelRepo.Create(ctx, model); err != nil {
		return err
	}
	if model.Type == domain.ModelTypeEmbedding || model.Type == domain.ModelTypeRerank || model.Type == domain.ModelTypeAnalysis {
		if id, err := u.ragStore.AddModel(ctx, model); err != nil {
			return err
		} else {
			model.ID = id
		}
	}
	if model.Type == domain.ModelTypeEmbedding {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}

func (u *ModelUsecase) GetList(ctx context.Context) ([]*domain.ModelListItem, error) {
	return u.modelRepo.GetList(ctx)
}

// trigger upsert records after embedding model is updated or created
func (u *ModelUsecase) TriggerUpsertRecords(ctx context.Context) error {
	// update to new dataset
	kbList, err := u.kbRepo.GetKnowledgeBaseList(ctx)
	if err != nil {
		return fmt.Errorf("get knowledge base list failed: %w", err)
	}
	for _, kb := range kbList {
		newDatasetID, err := u.ragStore.CreateKnowledgeBase(ctx)
		if err != nil {
			return fmt.Errorf("create new dataset failed: %w", err)
		}
		if err := u.ragStore.DeleteKnowledgeBase(ctx, kb.DatasetID); err != nil {
			return fmt.Errorf("delete old dataset failed: %w", err)
		}
		if err := u.kbRepo.UpdateDatasetID(ctx, kb.ID, newDatasetID); err != nil {
			return fmt.Errorf("update knowledge base dataset id failed: %w", err)
		}
	}
	// traverse all nodes
	err = u.nodeRepo.TraverseNodesByCursor(ctx, func(nodeRelease *domain.NodeRelease) error {
		// async upsert vector content via mq
		nodeContentVectorRequests := []*domain.NodeReleaseVectorRequest{
			{
				KBID:          nodeRelease.KBID,
				NodeReleaseID: nodeRelease.ID,
				Action:        "upsert",
			},
		}
		if err := u.ragRepo.AsyncUpdateNodeReleaseVector(ctx, nodeContentVectorRequests); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (u *ModelUsecase) Update(ctx context.Context, req *domain.UpdateModelReq) error {
	if err := u.modelRepo.Update(ctx, req); err != nil {
		return err
	}
	if req.Type == domain.ModelTypeEmbedding || req.Type == domain.ModelTypeRerank || req.Type == domain.ModelTypeAnalysis {
		updateModel := &domain.Model{
			ID:       req.ID,
			Model:    req.Model,
			Type:     req.Type,
			BaseURL:  req.BaseURL,
			APIKey:   req.APIKey,
			IsActive: true,
		}
		if req.Parameters != nil {
			updateModel.Parameters = *req.Parameters
		}
		if req.Type == domain.ModelTypeAnalysis && req.IsActive != nil {
			updateModel.IsActive = *req.IsActive
		}
		if err := u.ragStore.UpdateModel(ctx, updateModel); err != nil {
			return err
		}
	}
	if req.Type == domain.ModelTypeEmbedding {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}

func (u *ModelUsecase) GetChatModel(ctx context.Context) (*domain.Model, error) {
	return u.modelRepo.GetChatModel(ctx)
}

func (u *ModelUsecase) UpdateUsage(ctx context.Context, modelID string, usage *schema.TokenUsage) error {
	return u.modelRepo.UpdateUsage(ctx, modelID, usage)
}
