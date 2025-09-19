'use client';
import { IconFold, IconSearch, IconUnfold } from '@/components/icons';
import { useStore } from '@/provider';
import { filterTreeBySearch } from '@/utils';
import { addExpandState } from '@/utils/drag';
import CatalogFolder from '@/views/node/CatalogFolder';
import { Box, IconButton, TextField } from '@mui/material';
import { useDebounce } from 'ahooks';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

const Catalog = () => {
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

  const tree = useMemo(() => {
    const { tree: originalTree } = addExpandState(
      initialTree || [],
      id as string,
      catalogFolderExpand,
    );
    return filterTreeBySearch(originalTree, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = catalogWidth!;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(180, startWidth + (moveEvent.clientX - startX)); // 最小宽度180
      setCatalogWidth?.(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (mobile) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 11,
        px: 2,
        pb: 3,
        pt: 2,
        fontSize: 14,
        width: catalogShow ? catalogWidth : 0,
        transition: 'width 0.2s ease-in-out',
      }}
    >
      <Box
        style={{
          right: -16,
        }}
        sx={{
          color: 'text.primary',
          position: 'absolute',
          zIndex: 11,
          top: 18,
        }}
      >
        <IconButton
          size='small'
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            width: 32,
            height: 32,
            color: 'text.primary',
            bgcolor: 'background.paper2',
            '&:hover': {
              bgcolor: 'background.paper2',
              borderColor: 'divider',
            },
          }}
          onClick={() => setCatalogShow?.(!catalogShow)}
        >
          {catalogShow ? <IconFold /> : <IconUnfold />}
        </IconButton>
      </Box>
      <TextField
        slotProps={{
          input: {
            endAdornment: (
              <IconSearch sx={{ fontSize: 18, color: 'text.tertiary' }} />
            ),
          },
        }}
        size='small'
        placeholder='搜索'
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        sx={{
          width: 'calc(100% - 26px)',
          mb: 2,
          ml: 2,
          bgcolor: 'background.default',
          borderRadius: '10px',
          overflow: 'hidden',
          '& .MuiInputBase-input': {
            lineHeight: '24px',
            height: '24px',
            fontFamily: 'Mono',
            fontSize: 14,
          },
          '& .MuiOutlinedInput-root': {
            height: 36,
            fontSize: 14,
            pr: '18px',
            '& fieldset': {
              borderRadius: '10px',
              borderColor: 'divider',
              px: 2,
            },
          },
        }}
      />
      <Box
        sx={{
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 2,
            pb: 1,
            lineHeight: '22px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          目录
        </Box>
      </Box>

      <Box
        sx={{
          height: 'calc(100vh - 130px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {tree.map(item => (
          <CatalogFolder
            key={item.id}
            item={item}
            searchTerm={debouncedSearchTerm}
          />
        ))}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '1px',
          bgcolor: 'divider',
          cursor: 'col-resize',
        }}
        onMouseDown={handleMouseDown}
      />
    </Box>
  );
};

export default Catalog;
