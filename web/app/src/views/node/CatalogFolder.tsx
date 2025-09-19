import { ITreeItem } from '@/assets/type';
import { IconArrowDown } from '@/components/icons';
import { useStore } from '@/provider';
import { addOpacityToColor, highlightText } from '@/utils';
import { Ellipsis } from '@ctzhian/ui';
import { Box, Stack, useTheme } from '@mui/material';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface CatalogFolderProps {
  item: ITreeItem;
  depth?: number;
  searchTerm?: string;
}

const CatalogFolder = ({
  item,
  depth = 1,
  searchTerm = '',
}: CatalogFolderProps) => {
  const theme = useTheme();
  const { themeMode = 'light', setTree } = useStore();
  const params = useParams() || {};
  const activeId = params.id as string;
  const router = useRouter();

  return (
    <Stack key={item.id} gap={0.5}>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        gap={0.5}
        sx={{
          position: 'relative',
          lineHeight: '40px',
          cursor: 'pointer',
          borderRadius: '10px',
          color: activeId === item.id ? 'primary.main' : 'text.tertiary',
          bgcolor:
            activeId === item.id
              ? addOpacityToColor(theme.palette.primary.main, 0.08)
              : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            color: activeId === item.id ? 'primary.main' : 'text.primary',
            bgcolor:
              activeId === item.id
                ? addOpacityToColor(theme.palette.primary.main, 0.08)
                : themeMode === 'dark'
                  ? '#394052'
                  : 'background.paper3',
          },
        }}
        id={`catalog-item-${item.id}`}
        onClick={() => {
          if (item.type === 1) {
            item.expanded = !item.expanded;
            setTree?.(tree => [...(tree || [])]);
            return;
          }
          if (item.type === 2) {
            router.push(`/node/${item.id}`);
            return;
          }
        }}
      >
        {item.type === 2 ? (
          <Box sx={{ flex: 1 }}>
            <Link href={`/node/${item.id}`} prefetch={false}>
              <Box sx={{ pl: depth * 2, pr: 1 }}>
                <Stack direction='row' alignItems='center' gap={1}>
                  {/* {item.emoji ? (
                    <Box sx={{ flexShrink: 0, fontSize: 14 }}>{item.emoji}</Box>
                  ) : (
                    <IconFile sx={{ flexShrink: 0, fontSize: 12 }} />
                  )} */}
                  <Ellipsis sx={{ flex: 1, width: 0, pr: 1 }}>
                    {highlightText(item.name, searchTerm)}
                  </Ellipsis>
                </Stack>
              </Box>
            </Link>
          </Box>
        ) : (
          <Stack
            direction='row'
            alignItems='center'
            justifyContent={'space-between'}
            sx={{ flex: 1, pl: depth * 2, pr: 1 }}
          >
            <Stack direction='row' alignItems='center' gap={1} sx={{ flex: 1 }}>
              {/* {item.emoji ? (
                <Box sx={{ flexShrink: 0, fontSize: 12 }}>{item.emoji}</Box>
              ) : item.type === 1 ? (
                <IconFolder sx={{ flexShrink: 0, fontSize: 12 }} />
              ) : (
                <IconFile sx={{ flexShrink: 0, fontSize: 12 }} />
              )} */}
              <Ellipsis sx={{ flex: 1, width: 0, pr: 1 }}>
                {highlightText(item.name, searchTerm)}
              </Ellipsis>
            </Stack>
            <IconArrowDown
              sx={{
                color: 'text.disabled',
                flexShrink: 0,
                fontSize: 16,
                transform: item.expanded ? 'none' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }}
            />
          </Stack>
        )}
      </Stack>
      {item.children && item.children.length > 0 && item.expanded && (
        <Stack gap={0.5}>
          {item.children.map(child => (
            <CatalogFolder
              key={child.id}
              depth={depth + 1}
              item={child}
              searchTerm={searchTerm}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default CatalogFolder;
