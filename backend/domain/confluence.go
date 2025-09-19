package domain

type AnalysisConfluenceReq struct {
	KbID string `json:"kb_id" binding:"required" validate:"required"`
}

type AnalysisConfluenceResp struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Title   string `json:"title"`
}
