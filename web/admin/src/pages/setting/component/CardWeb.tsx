import { getApiV1AppDetail } from '@/request/App';
import {
  DomainAppDetailResp,
  DomainKnowledgeBaseDetail,
} from '@/request/types';
import { useEffect, useState } from 'react';
import CardAuth from './CardAuth';
import CardBasicInfo from './CardBasicInfo';
import CardCatalog from './CardCatalog';
import CardCustom from './CardCustom';
import CardFooter from './CardFooter';
import CardListen from './CardListen';
import CardProxy from './CardProxy';
import CardStyle from './CardStyle';
import CardWebCustomCode from './CardWebCustomCode';
import CardWebSEO from './CardWebSEO';
import CardWebWelcome from './CardWebWelcome';
import { SettingCard } from './Common';

interface CardWebProps {
  kb: DomainKnowledgeBaseDetail;
  refresh: () => void;
}

const CardWeb = ({ kb, refresh }: CardWebProps) => {
  const [info, setInfo] = useState<DomainAppDetailResp | null>(null);

  const getInfo = async () => {
    const res = await getApiV1AppDetail({ kb_id: kb.id!, type: '1' });
    setInfo(res);
  };

  useEffect(() => {
    getInfo();
  }, [kb]);

  if (!info?.id) return <></>;

  return (
    <SettingCard title='门户网站'>
      <CardListen kb={kb} refresh={refresh} />
      <CardProxy kb={kb} refresh={refresh} />
      <CardBasicInfo kb={kb} refresh={refresh} />
      <CardCustom></CardCustom>
      <CardAuth kb={kb} refresh={refresh} />
      <CardStyle
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              theme_mode: value.theme_mode,
              theme_and_style: {
                ...info.settings?.theme_and_style,
                doc_width: value.doc_width,
                bg_image: value.bg_image,
              },
            },
          });
        }}
      />
      {/* <CardWebHeader
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      /> */}
      <CardCatalog
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              catalog_settings: {
                ...info.settings?.catalog_settings,
                ...value,
              },
            },
          });
        }}
      />
      {/* <CardFooter
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              footer_settings: {
                ...info.settings?.footer_settings,
                ...value,
              },
            },
          });
        }}
      /> */}
      <CardWebWelcome
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />
      <CardWebSEO
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />

      <CardWebCustomCode
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />
    </SettingCard>
  );
};
export default CardWeb;
