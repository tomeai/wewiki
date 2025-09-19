package utils

import (
	"encoding/xml"
	"fmt"
	"strings"
)

// SitemapIndex sitemap index struct
type SitemapIndex struct {
	XMLName  xml.Name `xml:"sitemapindex"`
	Sitemaps []struct {
		Loc string `xml:"loc"`
	} `xml:"sitemap"`
}

// URLSet url set struct
type URLSet struct {
	XMLName xml.Name `xml:"urlset"`
	URLs    []struct {
		Loc string `xml:"loc"`
	} `xml:"url"`
}

// ParseSitemap parse sitemap
func ParseSitemap(url string) ([]string, error) {
	// get sitemap content
	content, err := HTTPGet(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get sitemap content: %v", err)
	}

	// decode content
	decoded := DecodeBytes(content)

	// check if xml format
	if strings.HasPrefix(strings.ToLower(decoded), "<?xml") {
		// try to parse as sitemap index
		var index SitemapIndex
		if err := xml.Unmarshal([]byte(decoded), &index); err == nil {
			// recursive handle each sub-sitemap
			links := make([]string, 0)
			for _, sitemap := range index.Sitemaps {
				if IsURLValid(sitemap.Loc) {
					subLinks, err := ParseSitemap(sitemap.Loc)
					if err != nil {
						return nil, fmt.Errorf("failed to parse sub-sitemap: %v", err)
					}
					links = append(links, subLinks...)
				}
			}
			return links, nil
		}

		// try to parse as url set
		var urlSet URLSet
		if err := xml.Unmarshal([]byte(decoded), &urlSet); err == nil {
			links := make([]string, 0)
			for _, url := range urlSet.URLs {
				if IsURLValid(url.Loc) {
					links = append(links, URLNormalize(url.Loc))
				}
			}
			return links, nil
		}

		return nil, fmt.Errorf("invalid sitemap format: %s", decoded[:100])
	}

	// handle text format sitemap
	links := make([]string, 0)
	for _, line := range strings.Split(decoded, "\n") {
		line = strings.TrimSpace(line)
		if IsURLValid(line) {
			links = append(links, URLNormalize(line))
		}
	}

	return links, nil
}
