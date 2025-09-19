package domain

import (
	"time"

	"github.com/chaitin/panda-wiki/consts"
)

type APIToken struct {
	ID         string                  `json:"id" gorm:"primaryKey"`
	Name       string                  `json:"name" gorm:"not null"`
	UserID     string                  `json:"user_id" gorm:"not null"`
	Token      string                  `json:"token" gorm:"uniqueIndex;not null"`
	KbId       string                  `json:"kb_id" gorm:"not null"`
	Permission consts.UserKBPermission `json:"permission" gorm:"not null"`
	CreatedAt  time.Time               `json:"created_at"`
	UpdatedAt  time.Time               `json:"updated_at"`
}

func (APIToken) TableName() string {
	return "api_tokens"
}
