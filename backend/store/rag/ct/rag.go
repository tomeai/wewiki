package ct

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/base"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/commonmark"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/table"
	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"

	"github.com/chaitin/pandawiki/sdk/rag"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
)

type CTRAG struct {
	client *rag.Client
	logger *log.Logger
	mdConv *converter.Converter
}

func NewCTRAG(config *config.Config, logger *log.Logger) (*CTRAG, error) {
	client := rag.New(
		config.RAG.CTRAG.BaseURL,
		config.RAG.CTRAG.APIKey,
	)
	conv := converter.NewConverter(
		converter.WithPlugins(
			base.NewBasePlugin(),
			commonmark.NewCommonmarkPlugin(),
			table.NewTablePlugin(
				table.WithSpanCellBehavior(table.SpanBehaviorMirror),
				table.WithNewlineBehavior(table.NewlineBehaviorPreserve),
			),
		),
	)
	return &CTRAG{
		client: client,
		logger: logger.WithModule("store.vector.ct"),
		mdConv: conv,
	}, nil
}

func (s *CTRAG) CreateKnowledgeBase(ctx context.Context) (string, error) {
	dataset, err := s.client.CreateDataset(ctx, rag.CreateDatasetRequest{
		Name: uuid.New().String(),
	})
	if err != nil {
		return "", err
	}
	return dataset.ID, nil
}

func (s *CTRAG) QueryRecords(ctx context.Context, datasetIDs []string, query string, groupIds []int, historyMsgs []*schema.Message) ([]*domain.NodeContentChunk, error) {
	var chatMsgs []rag.ChatMessage
	for _, msg := range historyMsgs {
		switch msg.Role {
		case schema.User:
			chatMsgs = append(chatMsgs, rag.ChatMessage{
				Role:    string(msg.Role),
				Content: msg.Content,
			})
		case schema.Assistant:
			chatMsgs = append(chatMsgs, rag.ChatMessage{
				Role:    string(msg.Role),
				Content: msg.Content,
			})
		default:
			continue
		}
	}
	s.logger.Debug("retrieving by history msgs", log.Any("history_msgs", historyMsgs), log.Any("chat_msgs", chatMsgs))
	chunks, _, rewriteQuery, err := s.client.RetrieveChunks(ctx, rag.RetrievalRequest{
		DatasetIDs:   datasetIDs,
		Question:     query,
		TopK:         10,
		UserGroupIDs: groupIds,
		ChatMessages: chatMsgs,
		// SimilarityThreshold: 0.2,
	})
	s.logger.Info("retrieve chunks result", log.Int("chunks count", len(chunks)), log.String("query", rewriteQuery))

	if err != nil {
		return nil, err
	}

	nodeChunks := make([]*domain.NodeContentChunk, len(chunks))
	for i, chunk := range chunks {
		nodeChunks[i] = &domain.NodeContentChunk{
			ID:      chunk.ID,
			Content: chunk.Content,
			DocID:   chunk.DocumentID,
		}
	}
	return nodeChunks, nil
}

func (s *CTRAG) UpsertRecords(ctx context.Context, datasetID string, nodeRelease *domain.NodeRelease, groupIds []int) (string, error) {
	// create new doc and return new_doc.doc_id
	tempFile, err := os.CreateTemp("", fmt.Sprintf("%s-*.md", nodeRelease.ID))
	if err != nil {
		return "", fmt.Errorf("create temp file failed: %w", err)
	}
	// convert html to markdown
	markdown := nodeRelease.Content
	if strings.HasPrefix(nodeRelease.Content, "<") {
		markdown, err = s.mdConv.ConvertString(nodeRelease.Content)
		if err != nil {
			return "", fmt.Errorf("convert html to markdown failed: %w", err)
		}
	}
	if _, err := tempFile.Write([]byte(markdown)); err != nil {
		return "", fmt.Errorf("write temp file failed: %w", err)
	}
	if err := tempFile.Close(); err != nil {
		return "", fmt.Errorf("close temp file failed: %w", err)
	}
	defer os.Remove(tempFile.Name())
	docs, err := s.client.UploadDocumentsAndParse(ctx, datasetID, []string{tempFile.Name()}, groupIds)
	if err != nil {
		return "", fmt.Errorf("upload document text failed: %w", err)
	}
	if len(docs) == 0 {
		return "", fmt.Errorf("no docs found")
	}
	return docs[0].ID, nil
}

func (s *CTRAG) DeleteRecords(ctx context.Context, datasetID string, docIDs []string) error {
	if err := s.client.DeleteDocuments(ctx, datasetID, docIDs); err != nil {
		return err
	}
	return nil
}

func (s *CTRAG) DeleteKnowledgeBase(ctx context.Context, datasetID string) error {
	if err := s.client.DeleteDatasets(ctx, []string{datasetID}); err != nil {
		return err
	}
	return nil
}

func (s *CTRAG) AddModel(ctx context.Context, model *domain.Model) (string, error) {
	config, err := json.Marshal(model.Parameters)
	if err != nil {
		return "", fmt.Errorf("failed to marshal parameters when adding model: %v", err)
	}
	addReq := rag.AddModelConfigRequest{
		Name:      model.Model,
		Provider:  string(model.Provider),
		TaskType:  string(model.Type),
		ApiBase:   model.BaseURL,
		ApiKey:    model.APIKey,
		MaxTokens: 8192,
		IsDefault: true,
		Enabled:   true,
		Config:    config,
	}
	modelConfig, err := s.client.AddModelConfig(ctx, addReq)
	if err != nil {
		return "", err
	}
	return modelConfig.ID, nil
}

func (s *CTRAG) UpdateModel(ctx context.Context, model *domain.Model) error {
	config, err := json.Marshal(model.Parameters)
	if err != nil {
		return fmt.Errorf("failed to marshal model params with err: %v", err)
	}
	updateReq := rag.AddModelConfigRequest{
		Name:      model.Model,
		Provider:  string(model.Provider),
		TaskType:  string(model.Type),
		ApiBase:   model.BaseURL,
		ApiKey:    model.APIKey,
		MaxTokens: 8192,
		IsDefault: true,
		Enabled:   model.IsActive,
		Config:    config,
	}
	_, err = s.client.AddModelConfig(ctx, updateReq)
	if err != nil {
		return err
	}
	return nil
}

func (s *CTRAG) DeleteModel(ctx context.Context, model *domain.Model) error {
	err := s.client.DeleteModelConfig(ctx, []rag.ModelItem{
		{
			Name:    model.Model,
			ApiBase: model.BaseURL,
		},
	})
	if err != nil {
		return err
	}
	return nil
}

func (s *CTRAG) GetModelList(ctx context.Context) ([]*domain.Model, error) {
	modelList, err := s.client.GetModelConfigList(ctx)
	if err != nil {
		return nil, err
	}
	models := make([]*domain.Model, len(modelList))
	for i, model := range modelList {
		models[i] = &domain.Model{
			ID:      model.ID,
			Model:   model.Name,
			BaseURL: model.ApiBase,
			APIKey:  model.ApiKey,
			Type:    domain.ModelType(model.TaskType),
		}
	}
	return models, nil
}

func (s *CTRAG) UpdateDocumentGroupIDs(ctx context.Context, datasetID string, docID string, groupIds []int) error {
	err := s.client.UpdateDocumentGroupIDs(ctx, datasetID, docID, groupIds)
	if err != nil {
		return fmt.Errorf("update document group IDs failed: %w", err)
	}
	return nil
}
