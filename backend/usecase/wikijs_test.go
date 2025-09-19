package usecase

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"os"
	"testing"

	"github.com/chaitin/panda-wiki/domain"
)

func TestWikiJS(t *testing.T) {
	url := "/path/export4/pages.json.gz"
	f, err := os.Open(url)
	if err != nil {
		t.Error(err)
	}
	defer f.Close()
	gzReader, err := gzip.NewReader(f)
	if err != nil {
		t.Error(err)
	}
	defer gzReader.Close()

	// 2. 读取解压后的内容
	data, err := io.ReadAll(gzReader)
	if err != nil {
		t.Error(err)
	}

	// 3. 反序列化 JSON
	var pages []domain.WikiJSPage
	if err := json.Unmarshal(data, &pages); err != nil {
		t.Error(err)
	}
	for _, page := range pages {
		t.Log(page.Id, page.Title)
	}
}
