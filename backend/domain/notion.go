package domain

type Page struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	ParentId string `json:"parent_id"`
	Content  string `json:"content"`
}
type PageInfo struct {
	Id    string `json:"id"`
	Title string `json:"title"`
}
type GetDocsReq struct {
	Integration string     `json:"integration"`
	PageIDs     []PageInfo `json:"pages"`
	KbID        string     `json:"kb_id" binding:"required" validate:"required"`
}
