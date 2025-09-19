package domain

type WikiJSReq struct {
	KBID string `json:"kb_id" validate:"required"`
}
type WikiJSPage struct {
	Id          int    `json:"id"`
	Description string `json:"description"`
	Title       string `json:"title"`
	ContentType string `json:"contentType"`
	Content     string `json:"content"`
	Render      string `json:"render"`
}

type WikiJSResp struct {
	Id      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}
