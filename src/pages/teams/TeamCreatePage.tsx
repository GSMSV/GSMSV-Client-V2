import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { createTeam } from '../../features/team/create-team';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { ApiRequestError } from '../../shared/api';
import { Button, TextField } from '../../shared/ui/controls';
import { Banner } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell } from '../../widgets/student-shell';
import { getSessionUser } from '../../entities/session';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Intro = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FormCard = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const CardDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TextAreaGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Purpose = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 72px;
  resize: vertical;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.field};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &:focus { border: 2px solid ${({ theme }) => theme.colors.primary}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const InfoCard = styled.section`
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const InfoTitle = styled.h2`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const InfoList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const InfoRow = styled.li`
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child { border-bottom: 0; }
`;

const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
  color: ${({ theme }) => theme.colors.muted};
`;

const InfoCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const InfoDescription = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const PeriodNote = styled.section`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const PeriodIcon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.muted};
`;

const PeriodCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PeriodTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const PeriodDescription = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

function createErrorMessage(error: unknown) {
  if (!(error instanceof ApiRequestError)) return '팀을 만들지 못했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.';
  if (error.status === 400) return '팀 이름을 확인해 주세요. 앞뒤 공백을 제외하고 1~30자로 입력해야 합니다.';
  if (error.status === 401) return '로그인이 만료되었습니다. 다시 로그인한 뒤 시도해 주세요.';
  return '팀을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function TeamCreatePage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void listMyTeams(controller.signal).then(value => {
      if (!controller.signal.aborted) setTeams(value);
    }).catch(() => {
      if (!controller.signal.aborted) setTeams([]);
    });
    return () => controller.abort();
  }, []);

  const scopeOptions = useMemo(() => {
    const roleLabels: Record<TeamRole, string> = { leader: '팀장', devops: 'DevOps', member: '팀원' };
    return [
      { id: 'personal', label: '내 Resources', selected: true, onSelect: () => navigate('/') },
      ...teams.map(team => ({
        id: team.id,
        label: `${team.name} · ${roleLabels[team.my_role]}`,
        selected: false,
        onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`),
      })),
    ];
  }, [navigate, teams]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 30) {
      setError('팀 이름은 앞뒤 공백을 제외하고 1~30자로 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const team = await createTeam(normalizedName);
      navigate(`/teams/${encodeURIComponent(team.id)}`, { replace: true });
    } catch (requestError) {
      setError(createErrorMessage(requestError));
      setSubmitting(false);
    }
  };

  return (
    <StudentShell
      activeItem="team"
      scopeLabel="내 Resources"
      scopeOptions={scopeOptions}
      userName={user?.name ?? '사용자'}
      onNavigate={(item) => {
        if (item === 'team') navigate('/teams');
        else if (item === 'database') navigate('/databases');
        else if (item === 'apps') navigate('/apps');
        else if (item === 'vm-create') navigate('/vms/new');
      }}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => {}}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={Boolean(name || purpose)}
    >
      <Page>
        <Breadcrumb>팀 / 새 팀</Breadcrumb>
        <Intro>
          <Title>팀 만들기</Title>
          <Subtitle>친구와 함께 VM을 관리할 팀을 만듭니다. 관리자가 승인하면 팀 VM을 만들 수 있습니다.</Subtitle>
        </Intro>

        <FormCard onSubmit={submit} noValidate>
          <CardHeading>
            <CardTitle>팀 정보</CardTitle>
            <Button type="submit" icon={<Octicon name="people" size={16} />} disabled={submitting}>
              {submitting ? '팀 만드는 중…' : '팀 만들기'}
            </Button>
          </CardHeading>
          <CardDescription>만든 사람이 첫 팀장이 됩니다. 팀장은 나중에 다른 팀원에게 넘길 수 있습니다.</CardDescription>
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
          <Fields>
            <TextField
              label="팀 이름"
              name="team-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              required
              autoComplete="organization"
              placeholder="팀 이름을 입력해 주세요"
              hint="앞뒤 공백을 제외하고 1~30자까지 입력할 수 있습니다."
              disabled={submitting}
            />
            <TextAreaGroup>
              <Label htmlFor="team-purpose">사용 목적</Label>
              <Purpose
                id="team-purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                maxLength={500}
                disabled={submitting}
                aria-describedby="team-purpose-hint"
              />
              <Hint id="team-purpose-hint">현재 팀 생성 API는 팀 이름만 저장합니다. 이 목적은 요청에 포함되거나 저장되지 않습니다.</Hint>
            </TextAreaGroup>
          </Fields>
        </FormCard>

        <InfoGrid>
          <InfoCard>
            <InfoTitle>팀에서 할 수 있는 일</InfoTitle>
            <InfoList>
              <InfoRow>
                <InfoIcon aria-hidden="true"><Octicon name="server" size={16} /></InfoIcon>
                <InfoCopy><InfoLabel>팀 VM 함께 관리</InfoLabel><InfoDescription>팀원이 만든 VM을 보고 SSH로 접속할 수 있습니다.</InfoDescription></InfoCopy>
              </InfoRow>
              <InfoRow>
                <InfoIcon aria-hidden="true"><Octicon name="shield" size={16} /></InfoIcon>
                <InfoCopy><InfoLabel>역할로 권한 나누기</InfoLabel><InfoDescription>팀장과 DevOps는 생성·전원·설정을, 일반 팀원은 조회·연장을 합니다.</InfoDescription></InfoCopy>
              </InfoRow>
              <InfoRow>
                <InfoIcon aria-hidden="true"><Octicon name="cpu" size={16} /></InfoIcon>
                <InfoCopy><InfoLabel>팀 할당량</InfoLabel><InfoDescription>팀 VM은 개인 할당량과 별도로 팀 할당량을 씁니다.</InfoDescription></InfoCopy>
              </InfoRow>
            </InfoList>
          </InfoCard>

          <InfoCard>
            <InfoTitle>만든 뒤 순서</InfoTitle>
            <InfoList>
              <InfoRow>
                <InfoIcon aria-hidden="true"><Octicon name="checklist" size={16} /></InfoIcon>
                <InfoCopy><InfoLabel>1. 관리자 승인</InfoLabel><InfoDescription>승인하면서 관리자가 팀 할당량을 정합니다.</InfoDescription></InfoCopy>
              </InfoRow>
              <InfoRow>
                <InfoIcon aria-hidden="true"><Octicon name="people" size={16} /></InfoIcon>
                <InfoCopy><InfoLabel>2. 팀원 초대</InfoLabel><InfoDescription>승인을 기다리는 동안에도 팀원을 초대할 수 있습니다.</InfoDescription></InfoCopy>
              </InfoRow>
              <InfoRow>
                <InfoIcon aria-hidden="true"><Octicon name="plus" size={16} /></InfoIcon>
                <InfoCopy><InfoLabel>3. 팀 VM 만들기</InfoLabel><InfoDescription>팀이 승인되면 팀장과 DevOps가 만들 수 있습니다.</InfoDescription></InfoCopy>
              </InfoRow>
            </InfoList>
          </InfoCard>
        </InfoGrid>

        <PeriodNote>
          <PeriodIcon aria-hidden="true"><Octicon name="calendar" size={20} /></PeriodIcon>
          <PeriodCopy>
            <PeriodTitle>팀 VM의 사용 기간</PeriodTitle>
            <PeriodDescription>첫 달(31일)은 삭제되지 않고, 이후 만료 7일 전부터 팀원 누구나 14일씩 연장할 수 있습니다.</PeriodDescription>
          </PeriodCopy>
        </PeriodNote>

        <Banner
          tone="neutral"
          icon={<Octicon name="info" size={20} />}
          title="새 팀은 관리자 승인 대기 상태로 만들어집니다."
          description="승인 전에는 팀 자원을 만들 수 없지만, 팀원 초대와 팀 정보 확인은 할 수 있습니다."
        />
      </Page>
    </StudentShell>
  );
}
