'use client';
import { IconMulu } from '@/components/icons';
import { useStore } from '@/provider';
import { filterTreeBySearch } from '@/utils';
import { addExpandState } from '@/utils/drag';
import { Box, Stack, SxProps, Tooltip } from '@mui/material';
import { useDebounce } from 'ahooks';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import CatalogFolder from './CatalogFolder';

const Catalog = ({ sx }: { sx?: SxProps }) => {
  const params = useParams() || {};
  const id = params.id as string;
  const {
    kbDetail,
    mobile = false,
    catalogShow,
    setCatalogShow,
    catalogWidth,
    setCatalogWidth,
    tree: initialTree,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 300 });

  const catalogSetting = kbDetail?.settings?.catalog_settings;
  const catalogFolderExpand = catalogSetting?.catalog_folder !== 2;
  const docWidth = kbDetail?.settings?.theme_and_style?.doc_width || 'full';

  const tree = useMemo(() => {
    const { tree: originalTree } = addExpandState(
      initialTree || [],
      id as string,
      catalogFolderExpand,
    );
    return filterTreeBySearch(originalTree, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const listRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (!id || !catalogShow) return;
    // 等待子项渲染完成后再滚动
    const scrollToActive = () => {
      const el = document.getElementById(`catalog-item-${id}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        hasScrolledRef.current = true;
      }
    };
    const raf = requestAnimationFrame(scrollToActive);
    return () => cancelAnimationFrame(raf);
  }, [id, catalogShow]);

  if (mobile) return null;

  return (
    <Stack
      flexShrink={0}
      alignItems={docWidth === 'full' ? 'flex-start' : 'flex-end'}
      sx={{
        position: 'sticky',
        top: 114,
        maxHeight: 'calc(100vh - 164px)',
        zIndex: 9,
        fontSize: 14,
        width: catalogWidth,
        maxWidth: catalogWidth,
        minWidth: 24,
        overflow: 'hidden',
        transition: 'width 0.3s ease-in-out',
        ...(!catalogShow &&
          docWidth === 'full' && {
            width: 24,
          }),
        ...sx,
      }}
    >
      {!catalogShow ? (
        <Stack
          direction={'row'}
          justifyContent={'flex-end'}
          sx={{
            height: '22px',
            mb: 2,
            ...(docWidth === 'full' ? { ml: 1 } : { mr: 1 }),
          }}
        >
          <Tooltip title={catalogShow ? null : '展开目录'} arrow>
            <IconMulu
              sx={{
                fontSize: 16,
                cursor: 'pointer',
                mr: 1,
                height: 22,
                lineHeight: '22px',
              }}
              onClick={() => setCatalogShow?.(!catalogShow)}
            />
          </Tooltip>
        </Stack>
      ) : (
        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          gap={1}
          sx={{
            width: '100%',
            mb: 2,
            pl: 2,
            pr: 1,
            height: '22px',
          }}
        >
          <Box
            sx={{
              fontWeight: 'bold',
              width: '30px',
              wordBreak: 'keep-all',
            }}
          >
            目录
          </Box>
          <IconMulu
            sx={{ fontSize: 16, cursor: 'pointer' }}
            onClick={() => setCatalogShow?.(!catalogShow)}
          />
        </Stack>
      )}
      <Stack
        gap={0.5}
        sx={{
          maxHeight: 'calc(100vh - 202px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          transition: 'width 0.3s ease-in-out',
          ...(!catalogShow && {
            width: 0,
          }),
        }}
        ref={listRef}
      >
        {tree.map(item => (
          <CatalogFolder
            key={item.id}
            item={item}
            searchTerm={debouncedSearchTerm}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export default Catalog;
