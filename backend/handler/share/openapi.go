package share

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"

	v1 "github.com/chaitin/panda-wiki/api/share/v1"
	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/usecase"
)

type OpenapiV1Handler struct {
	*handler.BaseHandler
	logger      *log.Logger
	authUseCase *usecase.AuthUsecase
}

func NewOpenapiV1Handler(
	e *echo.Echo,
	baseHandler *handler.BaseHandler,
	logger *log.Logger,
	authUseCase *usecase.AuthUsecase,
) *OpenapiV1Handler {
	h := &OpenapiV1Handler{
		BaseHandler: baseHandler,
		logger:      logger,
		authUseCase: authUseCase,
	}

	OpenapiGroup := e.Group("/share/v1/openapi")

	OpenapiGroup.Any("/github/callback", h.GitHubCallback)

	return h
}

// GitHubCallback GitHub回调
//
//	@Tags			ShareOpenapi
//	@Summary		GitHub回调
//	@Description	GitHub回调
//	@ID				v1-GitHubCallback
//	@Accept			json
//	@Produce		json
//	@Param			param	query		v1.GitHubCallbackReq	true	"para"
//	@Success		200		{object}	domain.PWResponse{data=v1.GitHubCallbackResp}
//	@Router			/share/v1/openapi/github/callback [get]
func (h *OpenapiV1Handler) GitHubCallback(c echo.Context) error {
	ctx := context.WithValue(c.Request().Context(), consts.ContextKeyEdition, consts.GetLicenseEdition(c))

	var req v1.GitHubCallbackReq
	if err := c.Bind(&req); err != nil {
		return err
	}
	if req.Code == "" {
		return h.NewResponseWithError(c, "code is required", nil)
	}

	auth, redirectUrl, err := h.authUseCase.GitHubCallback(ctx, req)
	if err != nil {
		return h.NewResponseWithError(c, "handle callback failed", err)
	}

	if err := h.authUseCase.SaveNewSession(c, auth); err != nil {
		return h.NewResponseWithError(c, "save session failed", err)
	}

	return c.Redirect(http.StatusFound, redirectUrl)
}
