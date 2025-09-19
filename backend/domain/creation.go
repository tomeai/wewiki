package domain

type TextReq struct {
	Text   string `json:"text" validate:"required"`
	Action string `json:"action"` // action: improve, summary, extend, shorten, etc.
}
