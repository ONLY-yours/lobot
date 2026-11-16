import { Block, Flexbox, Icon, Text } from '@lobehub/ui';
import { ChevronDownIcon, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ProjectSelector from '@/features/AgentTasks/features/ProjectSelector';
import ProjectAvatar from '@/features/Projects/ProjectAvatar';
import { projectListItemSelector, useProjectStore } from '@/store/project';
import { useUserStore } from '@/store/user';
import { labPreferSelectors } from '@/store/user/selectors';

interface ScopeFieldProps {
  inert?: boolean;
  onChange: (projectId: string | null) => void;
  /** `null` for a general Channel outside any project. */
  value: string | null;
}

/**
 * Whether a new Channel is a general one or a project's. A project Channel lists under that
 * project and offers its Agents first. Hidden while the Projects lab is off: every Channel is
 * then general.
 */
export const ScopeField = ({ inert, onChange, value }: ScopeFieldProps) => {
  const { t } = useTranslation('channel');
  const enabled = useUserStore(labPreferSelectors.enableProjects);
  const project = useProjectStore(projectListItemSelector(value));

  if (!enabled) return null;

  return (
    <Flexbox gap={6} inert={inert}>
      <Text weight={500}>{t('scope.label')}</Text>
      <ProjectSelector fullWidth noneLabel={t('scope.general')} value={value} onChange={onChange}>
        <Block
          clickable
          horizontal
          align={'center'}
          gap={8}
          paddingBlock={6}
          paddingInline={11}
          style={{ width: '100%' }}
          variant={'filled'}
        >
          {project ? (
            <ProjectAvatar avatar={project.avatar} id={project.id} name={project.name} size={18} />
          ) : (
            <Icon icon={Hash} size={14} />
          )}
          <Text ellipsis style={{ flex: 1 }}>
            {project?.name ?? t('scope.general')}
          </Text>
          <Icon icon={ChevronDownIcon} size={14} />
        </Block>
      </ProjectSelector>
      <Text fontSize={12} type={'secondary'}>
        {t(project ? 'scope.projectHint' : 'scope.generalHint')}
      </Text>
    </Flexbox>
  );
};
