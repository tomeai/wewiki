import { ITreeItem, NodeListFilterData } from '@/api';
import { getApiV1NodeList } from '@/request/Node';
import { DomainNodeListItemResp, V1NodeDetailResp } from '@/request/types';
import { useAppSelector } from '@/store';
import { convertToTree } from '@/utils/drag';
import { filterEmptyFolders } from '@/utils/tree';
import { Ellipsis, Icon } from '@ctzhian/ui';
import { alpha, Box, Stack, useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import KBSwitch from './KBSwitch';

interface CatalogProps {
  curNode: V1NodeDetailResp;
  setCatalogOpen: (open: boolean) => void;
}

const Catalog = ({ curNode, setCatalogOpen }: CatalogProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { pathname } = useLocation();
  const { kb_id = '', kbDetail } = useAppSelector(state => state.config);

  const isHistory = useMemo(() => {
    return pathname.includes('/doc/editor/history');
  }, [pathname]);

  const [nodeList, setNodeList] = useState<DomainNodeListItemResp[]>([]);
  const [data, setData] = useState<ITreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const getCatalogData = useCallback(() => {
    const params: NodeListFilterData = {
      kb_id: kb_id || localStorage.getItem('kb_id') || '',
    };
    getApiV1NodeList(params).then(res => {
      setNodeList(res);
      const v = filterEmptyFolders(convertToTree(res || []));
      setData(v);
      // 计算当前文档的所有父级文件夹，并默认展开
      try {
        const currentId = id as string;
        if (!currentId) {
          setExpandedFolders(new Set());
          return;
        }

        const map = new Map<string, DomainNodeListItemResp>();
        (res || []).forEach(item => {
          if (item?.id) map.set(item.id, item);
        });

        const expanded = new Set<string>();
        let cur = map.get(currentId);
        while (cur && cur.parent_id) {
          const parent = map.get(cur.parent_id);
          if (!parent) break;
          if (parent.type === 1 && parent.id) {
            expanded.add(parent.id);
          }
          cur = parent;
        }
        setExpandedFolders(expanded);
      } catch (e) {
        setExpandedFolders(new Set());
      }
    });
  }, [kb_id]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderTree = (items: ITreeItem[], pl = 2.5, depth = 1) => {
    const sortedItems = [...items].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    return sortedItems.map(item => (
      <Stack key={item.id} sx={{ position: 'relative' }}>
        <Stack
          direction={'row'}
          alignItems={'center'}
          gap={1}
          sx={{
            pl: pl * depth,
            py: 0.75,
            borderRadius: 1,
            cursor: 'pointer',
            fontWeight: item.type === 1 ? 'bold' : 'normal',
            color: id === item.id ? 'primary.main' : 'text.primary',
            bgcolor:
              id === item.id
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
            '&:hover': {
              bgcolor:
                id === item.id
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'action.hover',
            },
          }}
          onClick={async () => {
            if (item.type === 1) {
              toggleFolder(item.id);
            } else {
              // if (edited) await save(true);
              if (isHistory) {
                navigate(`/doc/editor/history/${item.id}`);
              } else {
                navigate(`/doc/editor/${item.id}`);
              }
            }
          }}
        >
          {item.type === 1 && (
            <Box
              sx={{
                position: 'absolute',
                left: -18 + (pl || 0) * 8 * depth,
                top: 6,
              }}
            >
              <Icon
                type='icon-xiajiantou'
                sx={{
                  fontSize: 16,
                  color: 'text.disabled',
                  flexShrink: 0,
                  transform: expandedFolders.has(item.id)
                    ? 'none'
                    : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </Box>
          )}
          {item.emoji ? (
            <Box sx={{ fontSize: 13, flexShrink: 0 }}>{item.emoji}</Box>
          ) : (
            <Icon
              type={item.type === 1 ? 'icon-wenjianjia' : 'icon-wenjian'}
              sx={{ color: '#2f80f7', flexShrink: 0 }}
            />
          )}
          <Ellipsis>{item.name}</Ellipsis>
        </Stack>
        {item.children &&
          item.children.length > 0 &&
          expandedFolders.has(item.id) && (
            <Stack>{renderTree(item.children, 2.5, depth + 1)}</Stack>
          )}
      </Stack>
    ));
  };

  useEffect(() => {
    if (curNode.id) {
      const newNodeList = nodeList.map(item => {
        if (item.id === curNode.id) {
          return {
            ...item,
            name: curNode.name,
            emoji: curNode.meta?.emoji || '',
          };
        }
        return item;
      });
      setData(filterEmptyFolders(convertToTree(newNodeList || [])));
    }
  }, [curNode, nodeList]);

  useEffect(() => {
    getCatalogData();
  }, [kb_id]);

  return (
    <Stack
      sx={{
        bgcolor: 'background.paper3',
        height: '100%',
        color: 'text.primary',
      }}
    >
      <Stack
        direction='row'
        justifyContent='space-between'
        sx={{ p: 2 }}
        gap={1}
      >
        <Stack direction='row' alignItems='center' gap={1} sx={{ flex: 1 }}>
          <KBSwitch />
          <Ellipsis
            sx={{ fontSize: 14, fontWeight: 'bold', width: 0, flex: 1 }}
          >
            {kbDetail.name}
          </Ellipsis>
        </Stack>
        <Stack
          alignItems='center'
          justifyContent='space-between'
          onClick={() => setCatalogOpen(false)}
          sx={{
            cursor: 'pointer',
            color: 'text.tertiary',
            ':hover': {
              color: 'text.primary',
            },
          }}
        >
          <Icon
            type='icon-mulushouqi'
            sx={{
              fontSize: 24,
            }}
          />
        </Stack>
      </Stack>
      <Box
        sx={{
          px: 2,
          fontSize: 14,
          fontWeight: 'bold',
          color: 'text.tertiary',
        }}
      >
        目录
      </Box>
      <Stack
        sx={{
          my: 1,
          px: 1,
          fontSize: 14,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {renderTree(data)}
      </Stack>
    </Stack>
  );
};

export default Catalog;
