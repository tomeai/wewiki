import { RecommendNode } from '@/assets/type';
import { useStore } from '@/provider';
import { V1RecommendNodeListItem } from '@/request/types';
import { Stack } from '@mui/material';
import NodeCard from './NodeCard';

const NodeList = ({
  recommendNodes,
}: {
  recommendNodes: V1RecommendNodeListItem[];
}) => {
  const { mobile = false, kbDetail } = useStore();

  return (
    <Stack
      direction={mobile ? 'column' : 'row'}
      flexWrap='wrap'
      alignItems={mobile ? 'center' : 'stretch'}
      gap={2}
      sx={{
        mt: 5,
        pb: 10,
        px: 10,
        maxWidth: '1200px',
        mx: 'auto',
        ...(mobile && {
          gap: 2,
          px: 0,
        }),
      }}
    >
      {recommendNodes.map((item: V1RecommendNodeListItem) => (
        <NodeCard key={item.id} node={item} />
      ))}
    </Stack>
  );
};

export default NodeList;
