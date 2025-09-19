import Home from '@/views/home';
import { getShareV1NodeRecommendList } from '@/request/ShareNode';

const HomePage = async () => {
  const data = await getShareV1NodeRecommendList({});
  return <Home recommendNodes={data || []} />;
};

export default HomePage;
