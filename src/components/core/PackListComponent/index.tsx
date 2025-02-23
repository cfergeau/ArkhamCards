import React, { useCallback, useContext } from 'react';
import { filter, groupBy, map } from 'lodash';
import {
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Brackets } from 'typeorm/browser';
import { t } from 'ttag';

import { Pack } from '@actions/types';
import CardSectionHeader from '@components/core/CardSectionHeader';
import PackRow from './PackRow';
import StyleContext from '@styles/StyleContext';

interface PackCycle extends SectionListData<Pack> {
  title: string;
  id: string;
  data: Pack[];
}

interface Props {
  componentId: string;
  alwaysShowCoreSet?: boolean;
  cyclesOnly?: boolean;
  coreSetName?: string;
  packs: Pack[];
  checkState?: { [pack_code: string]: boolean | undefined };
  setChecked: (pack_code: string, checked: boolean) => void;
  setCycleChecked?: (cycle_code: string, checked: boolean) => void;
  header?: JSX.Element;
  renderFooter?: () => JSX.Element;
  baseQuery?: Brackets;
  compact?: boolean;
  noFlatList?: boolean;
  includeNoCore?: boolean;
}

function keyExtractor(item: Pack) {
  return item.code;
}

function cycleName(position: string): string {
  switch (position) {
    case '1': return t`Core Set`;
    case '1_cycle': return t`Campaigns`;
    case '2': return t`The Dunwich Legacy`;
    case '3': return t`The Path to Carcosa`;
    case '4': return t`The Forgotten Age`;
    case '5': return t`The Circle Undone`;
    case '6': return t`The Dream-Eaters`;
    case '7': return t`The Innsmouth Conspiracy`;
    case '8': return t`Edge of the Earth`;
    case '9': return t`The Scarlet Keys`;
    case '50': return t`Return to...`;
    case '60': return t`Investigator Starter Decks`;
    case '70': return t`Standalone`;
    case '80': return t`Books`;
    case '90': return t`Parallel`;
    case '100': return t`Non-canon Content`;
    case '110': return t`Fan-made Campaigns`;
    case '120': return t`Fan-made Scenarios`;
    case '130': return t`Fan-made Investigators`;
    default: return 'Unknown';
  }
}

function renderSectionHeader({ section }: { section: SectionListData<Pack> }) {
  return (
    <CardSectionHeader
      section={{ subTitle: section.title }}
    />
  );
}

export default function PackListComponent({
  componentId,
  alwaysShowCoreSet,
  coreSetName,
  packs,
  checkState,
  setChecked,
  setCycleChecked,
  header,
  renderFooter,
  baseQuery,
  compact,
  noFlatList,
  cyclesOnly,
  includeNoCore,
}: Props) {
  const { typography } = useContext(StyleContext);
  const renderPack = useCallback((pack: Pack) => {
    const cyclePacks: Pack[] = pack.position === 1 ? filter(packs, p => {
      return (pack.cycle_position === p.cycle_position &&
        pack.id !== p.id);
    }) : [];
    if (pack.code === 'core' && (alwaysShowCoreSet || includeNoCore)) {
      return (
        <>
          { (alwaysShowCoreSet || includeNoCore) && pack.code === 'core' && (
            <PackRow
              key="always-core"
              componentId={componentId}
              pack={pack}
              packId="no_core"
              nameOverride={t`Core Set`}
              description={alwaysShowCoreSet ? t`A single core set is always included` : undefined}
              cycle={cyclePacks}
              baseQuery={baseQuery}
              compact={compact}
              setChecked={!alwaysShowCoreSet && !checkState?.core ? setChecked : undefined}
              checked={alwaysShowCoreSet || !checkState?.no_core}
            />
          ) }
          { (!includeNoCore || !checkState?.no_core) && (
            <PackRow
              key={pack.id}
              componentId={componentId}
              pack={pack}
              nameOverride={coreSetName}
              cycle={cyclePacks}
              setChecked={setChecked}
              setCycleChecked={setCycleChecked}
              checked={checkState && checkState[pack.code]}
              baseQuery={baseQuery}
              compact={compact}
              alwaysCycle={cyclesOnly}
            />
          ) }
        </>
      )
    }
    return (
      <PackRow
        key={pack.id}
        componentId={componentId}
        pack={pack}
        cycle={cyclePacks}
        setChecked={setChecked}
        setCycleChecked={setCycleChecked}
        checked={checkState && checkState[pack.code]}
        baseQuery={baseQuery}
        compact={compact}
        alwaysCycle={cyclesOnly}
      />
    );
  }, [packs, checkState, componentId, cyclesOnly, alwaysShowCoreSet, includeNoCore, setChecked, setCycleChecked, baseQuery, compact, coreSetName]);

  const renderItem = useCallback(({ item }: SectionListRenderItemInfo<Pack>) => {
    return renderPack(item);
  }, [renderPack]);


  if (!packs.length) {
    return (
      <View>
        <Text style={typography.text}>{t`Loading`}</Text>
      </View>
    );
  }
  if (noFlatList) {
    return (
      <View style={styles.container}>
        { !!header && header }
        { map(packs, item => renderPack(item)) }
        { !!renderFooter && renderFooter() }
      </View>
    );
  }
  const groups: PackCycle[] = map(
    groupBy(
      filter(packs, pack => pack.code !== 'books' && (
        !cyclesOnly ||
        pack.cycle_position < 2 ||
        pack.cycle_position >= 50 ||
        pack.position === 1
      ) && (!cyclesOnly || pack.cycle_position < 70)),
      pack => (cyclesOnly && pack.cycle_position >= 2 && pack.cycle_position < 50) ? 2 : pack.cycle_position),
    (group, key) => {
      return {
        title: key === '2' && cyclesOnly ? t`Campaigns Cycles` : cycleName(`${key}`),
        id: key,
        data: group,
      };
    });

  return (
    <SectionList
      ListHeaderComponent={header}
      ListFooterComponent={renderFooter}
      sections={groups}
      initialNumToRender={30}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled={false}
      extraData={checkState}
    />
  );
}

const styles = StyleSheet.create({
  container: {},
});
