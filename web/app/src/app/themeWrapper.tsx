// app/ThemeWrapper.tsx (客户端组件)
'use client';

import StoreProvider from '@/provider';
import { darkTheme, lightTheme } from '@/theme';
import { Box } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@ctzhian/ui';
import { useEffect, useState } from 'react';

export default function ThemeWrapper({
  initialTheme,
  kbDetail,
  isMobile,
  children,
}: {
  initialTheme: 'light' | 'dark';
  kbDetail: any;
  isMobile: boolean;
  children: React.ReactNode;
}) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    // 客户端初始化主题
    const savedTheme = localStorage.getItem('theme_mode');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeMode(savedTheme);
    }

    // 监听自定义主题切换事件
    const handleThemeChange = (e: CustomEvent) => {
      if (e.detail.theme === 'dark' || e.detail.theme === 'light') {
        setThemeMode(e.detail.theme);
      }
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener(
        'theme-change',
        handleThemeChange as EventListener,
      );
    };
  }, []);

  // 监听 storage 事件，当其他地方修改 localStorage 时更新主题
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'theme_mode' &&
        (e.newValue === 'dark' || e.newValue === 'light')
      ) {
        setThemeMode(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
      <AppRouterCacheProvider>
        <StoreProvider
          kbDetail={kbDetail}
          themeMode={themeMode}
          mobile={isMobile}
        >
          <Box sx={{ bgcolor: 'background.paper' }}>{children}</Box>
        </StoreProvider>
      </AppRouterCacheProvider>
    </ThemeProvider>
  );
}
