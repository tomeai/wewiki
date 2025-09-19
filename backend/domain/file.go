package domain

const (
	Bucket = "static-file"
)

type ObjectUploadResp struct {
	Key string `json:"key"`
}
