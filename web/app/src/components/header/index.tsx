'use client';

import Logo from '@/assets/images/logo.png';
import { IconSearch } from '@/components/icons';
import { useStore } from '@/provider';
import { Box, Button, IconButton, Stack, TextField } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import NavBtns from './NavBtns';
import { DocWidth } from '@/constant/index';
interface HeaderProps {
  isDocPage?: boolean;
  isWelcomePage?: boolean;
}
const Header = ({ isDocPage = false, isWelcomePage = false }: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { mobile = false, kbDetail, catalogShow, catalogWidth } = useStore();
  const [searchValue, setSearchValue] = useState('');
  const docWidth = useMemo(() => {
    if (isWelcomePage) return 'full';
    return kbDetail?.settings?.theme_and_style?.doc_width || 'full';
  }, [kbDetail, isWelcomePage]);
  const handleSearch = () => {
    if (searchValue.trim()) {
      sessionStorage.setItem('chat_search_query', searchValue.trim());
      router.push('/chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Stack
      direction='row'
      alignItems='center'
      justifyContent='center'
      sx={{
        transition: 'left 0.2s ease-in-out',
        position: 'sticky',
        zIndex: 10,
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        ...(mobile && {
          left: 0,
          pl: 3,
          pr: 1,
        }),
      }}
    >
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{
          width: '100%',
          ...(!isDocPage && {
            px: '15%',
          }),
          ...(isDocPage &&
            !mobile && {
              maxWidth: `calc(100vw - 80px)`,
              ...(docWidth !== 'full' && {
                width: `calc(${catalogWidth}px + 192px + 264px + ${DocWidth[docWidth as keyof typeof DocWidth].value}px)`,
              }),
            }),
        }}
      >
        <Link href={'/'} prefetch={false}>
          <Stack
            direction='row'
            alignItems='center'
            gap={1.5}
            sx={{
              py: '20px',
              cursor: 'pointer',
              color: 'text.primary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {kbDetail?.settings?.icon ? (
              <img src={kbDetail?.settings?.icon} alt='logo' width={32} />
            ) : (
              <Image src={Logo.src} width={32} height={32} alt='logo' />
            )}
            <Box sx={{ fontSize: 18 }}>{kbDetail?.settings?.title}</Box>
          </Stack>
        </Link>
        <Stack direction='row' alignItems='center' gap={2}>
          {pathname !== '/welcome' &&
            !pathname.startsWith('/chat') &&
            (mobile ? (
              <IconButton
                size='small'
                sx={{ width: 40, height: 40, color: 'text.primary' }}
              >
                <IconSearch
                  sx={{ fontSize: 20 }}
                  onClick={() => {
                    router.push(`/chat`);
                  }}
                />
              </IconButton>
            ) : (
              <TextField
                size='small'
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  kbDetail?.settings?.web_app_custom_style
                    ?.header_search_placeholder || '搜索'
                }
                sx={{
                  width: '300px',
                  bgcolor: 'background.default',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  '& .MuiInputBase-input': {
                    fontSize: 14,
                    lineHeight: '19.5px',
                    height: '19.5px',
                    fontFamily: 'Mono',
                  },
                  '& .MuiOutlinedInput-root': {
                    pr: '18px',
                    '& fieldset': {
                      borderRadius: '10px',
                      borderColor: 'divider',
                      px: 2,
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <IconSearch
                      onClick={handleSearch}
                      sx={{ cursor: 'pointer', color: 'text.tertiary' }}
                    />
                  ),
                }}
              />
            ))}
          {!mobile &&
            kbDetail?.settings?.btns?.map((item, index) => (
              <Link
                key={index}
                href={item.url}
                target={item.target}
                prefetch={false}
              >
                <Button
                  variant={item.variant}
                  startIcon={
                    item.showIcon && item.icon ? (
                      <img src={item.icon} alt='logo' width={24} height={24} />
                    ) : null
                  }
                  sx={{ textTransform: 'none' }}
                >
                  <Box sx={{ lineHeight: '24px' }}>{item.text}</Box>
                </Button>
              </Link>
            ))}
          {mobile && <NavBtns detail={kbDetail} />}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Header;
