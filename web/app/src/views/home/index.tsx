'use client';

import DarkBG from '@/assets/images/dark-bgi.png';
import LightBG from '@/assets/images/light-bgi.png';
import { IconSearch } from '@/components/icons';
import { useStore } from '@/provider';
import { V1RecommendNodeListItem } from '@/request/types';
import { Box, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CatalogH5 from '../node/CatalogH5';
import NodeList from './NodeList';
import QuestionList from './QuestionList';

const Home = ({
  recommendNodes,
}: {
  recommendNodes: V1RecommendNodeListItem[];
}) => {
  const { mobile = false, kbDetail, themeMode = 'light' } = useStore();

  const themeAndStyleSetting = kbDetail?.settings?.theme_and_style;

  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchText.trim()) {
      sessionStorage.setItem('chat_search_query', searchText.trim());
      router.push('/chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
      }}
    >
      {mobile && <CatalogH5 />}
      <Box
        sx={{
          pt: 10,
          pb: 5,
          backgroundImage: `url(${
            themeAndStyleSetting?.bg_image ||
            (themeMode === 'dark' ? DarkBG.src : LightBG.src)
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Box
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
            color: 'text.primary',
            fontSize: '40px',
            textAlign: 'center',
            fontWeight: '700',
            lineHeight: '44px',
            ...(mobile && {
              fontSize: '32px',
              lineHeight: '40px',
            }),
          }}
        >
          {kbDetail?.settings?.welcome_str}
        </Box>
        <Box
          sx={{
            width: '656px',
            margin: '40px auto 0',
            ...(mobile && {
              width: 'calc(100% - 48px)',
            }),
          }}
        >
          <TextField
            fullWidth
            sx={{
              width: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              '& .MuiInputBase-input': {
                p: 2,
                lineHeight: '24px',
                height: '24px',
                fontFamily: 'Mono',
              },
              '& .MuiOutlinedInput-root': {
                pr: '18px',
                bgcolor:
                  themeMode === 'dark'
                    ? 'background.paper3'
                    : 'background.default',
                '& fieldset': {
                  borderRadius: '10px',
                  borderColor: 'divider',
                  px: 2,
                },
              },
            }}
            placeholder={kbDetail?.settings?.search_placeholder || '开始搜索'}
            autoComplete='off'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <IconSearch
                  sx={{ cursor: 'pointer', color: 'text.tertiary' }}
                  onClick={handleSearch}
                />
              ),
            }}
          />
        </Box>
        {!mobile && <QuestionList />}
      </Box>
      <NodeList recommendNodes={recommendNodes} />
    </Box>
  );
};

export default Home;
