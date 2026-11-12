import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { useAppSourceDraft, type AppSourceType } from '../../features/app/create-app';
import { getSessionUser } from '../../entities/session';
import { Button } from '../../shared/ui/controls';
import { SelectField, StepIndicator, TextField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
`;

const Breadcrumb = styled.p`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Heading = styled.h1`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const StepRow = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const Steps = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StepLine = styled.span`
  width: 36px;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const Segmented = styled.div`
  display: flex;
  width: 100%;
  height: 42px;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
`;

const Segment = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  min-width: 0;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  color: ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.muted};
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};
  font-family: ${({ theme }) => theme.typography.button.family}, sans-serif;
  font-size: ${({ theme }) => theme.typography.button.size}px;
  font-weight: ${({ theme }) => theme.typography.button.weight};
  line-height: ${({ theme }) => theme.typography.button.lineHeight}px;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 1px; }
`;

const Card = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const AccountRow = styled.div`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 16px;
`;

const AccountText = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
`;

const Caption = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Body = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const IconSlot = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;

  @media (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`;

const DialogBackdrop = styled.div`
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0009;
`;

const Dialog = styled.section`
  display: flex;
  width: min(100%, 480px);
  flex-direction: column;
  gap: 16px;
  padding: 32px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 48px #0005;
`;

const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const DialogCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const SourceUnavailable = styled.div`
  display: flex;
  min-height: 72px;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const PreviewNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

type DialogKind = 'unsupported-source' | null;

export default function AppCreateSourcePage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const { draft, update } = useAppSourceDraft();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const isFigmaPreview = import.meta.env.DEV;
  const sourceTypeLabels: Record<AppSourceType, string> = {
    github: 'GitHub 저장소',
    container: '컨테이너 이미지',
    archive: '압축 파일',
  };
  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'apps') navigate('/apps');
  };

  const handleContinue = () => {
    if (draft.sourceType !== 'github') return;
    const name = draft.name.trim();
    if (name.length < 1 || name.length > 30) return;
    sessionStorage.setItem('gsmsv.app-create-source-draft', JSON.stringify({ name }));
    navigate('/apps/new/service');
  };

  return (
    <StudentShell
      activeItem="apps"
      scopeLabel="내 Resources"
      userName={user?.name ?? '사용자'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => undefined}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      onOpenProfile={() => undefined}
    >
      <Page>
        <Breadcrumb>Apps</Breadcrumb>
        <Heading>어디서 코드를 가져오시겠습니까?</Heading>
        {isFigmaPreview && <PreviewNotice role="note">
          <Octicon name="info" size={16} />
          Figma 미리보기 샘플입니다. 표시된 GitHub 계정과 저장소는 실제 연결 정보가 아닙니다.
        </PreviewNotice>}

        <StepRow>
          <Steps aria-label="앱 만들기 단계">
            <StepIndicator number={1} label="소스" active />
            <StepLine role="presentation" />
            <StepIndicator number={2} label="서비스" />
          </Steps>
          <Button variant="primary" icon={<Octicon name="arrow-right" size={16} />} iconPosition="end" onClick={handleContinue} disabled={draft.sourceType !== 'github' || !draft.name.trim() || draft.name.trim().length > 30}>
            다음: 서비스
          </Button>
        </StepRow>

        <Card>
          <CardTitle>소스</CardTitle>
          <Segmented role="group" aria-label="코드 소스 선택">
            {(Object.keys(sourceTypeLabels) as AppSourceType[]).map(type => (
              <Segment key={type} type="button" $selected={draft.sourceType === type} aria-pressed={draft.sourceType === type} onClick={() => {
                if (type !== 'github') {
                  setDialog('unsupported-source');
                  return;
                }
                update('sourceType', type);
              }}>{sourceTypeLabels[type]}</Segment>
            ))}
          </Segmented>
          {draft.sourceType === 'archive' && <Body>압축 파일은 100 MB까지 올릴 수 있습니다.</Body>}
        </Card>

        <Card>
          <CardTitle>{sourceTypeLabels[draft.sourceType]}</CardTitle>
          {draft.sourceType === 'github' ? <>
            <AccountRow>
              <IconSlot aria-hidden="true"><Octicon name="link" size={16} /></IconSlot>
              <AccountText>
                <Caption>GitHub 계정</Caption>
                <Body>{isFigmaPreview ? '@gsm-jimin · 연결됨' : 'GitHub 연결 정보를 확인할 API가 준비되지 않았습니다.'}</Body>
              </AccountText>
            </AccountRow>
            <AccountRow>
              <IconSlot aria-hidden="true"><Octicon name="shield" size={16} /></IconSlot>
              <AccountText>
                <Caption>GSMSV GitHub 앱</Caption>
                <Body>앱을 설치한 저장소만 고를 수 있습니다.</Body>
              </AccountText>
              <Button variant="ghost" icon={<Octicon name="gear" size={16} />} disabled>
                설치 저장소 바꾸기
              </Button>
            </AccountRow>
            {!isFigmaPreview && <SourceUnavailable role="status">
              <Octicon name="info" size={18} />
              GitHub 연결 API가 없어 저장소는 연결되지 않습니다. 다음 단계에서 앱 이름만 저장하는 앱을 만들 수 있고, 소스 설정은 전송하지 않습니다.
            </SourceUnavailable>}
              <SelectField
                label="저장소"
                value={draft.repository}
                placeholder="저장소 선택"
                disabled={!isFigmaPreview}
                options={isFigmaPreview && draft.repository ? [{ value: draft.repository, label: draft.repository }] : []}
                onChange={value => {
                  update('repository', value);
                  update('branch', isFigmaPreview ? 'main' : '');
                }}
              />
              <FieldGrid>
                <SelectField
                  label="브랜치"
                  value={draft.branch}
                  placeholder="브랜치 선택"
                  disabled={!isFigmaPreview || !draft.repository}
                  options={isFigmaPreview && draft.branch ? [{ value: draft.branch, label: draft.branch }] : []}
                  onChange={value => update('branch', value)}
                />
                <TextField
                  label="폴더"
                  value={draft.folder}
                  disabled={!isFigmaPreview}
                  onChange={event => update('folder', event.currentTarget.value)}
                  hint="저장소 안에서 이 앱의 코드가 있는 폴더입니다."
                />
              </FieldGrid>
              <TextField
                label="감시 경로"
                value={draft.watchPaths}
                disabled={!isFigmaPreview}
                onChange={event => update('watchPaths', event.currentTarget.value)}
                hint="이 경로의 파일이 바뀐 push만 배포합니다. 비워 두면 모든 push를 배포합니다."
              />

          </> : <SourceUnavailable role="status">
            <Octicon name="info" size={18} />
            이 소스 방식은 현재 앱 API 계약에 정의되어 있지 않습니다.
          </SourceUnavailable>}
        </Card>

        {draft.sourceType === 'github' && <Card>
          <CardTitle>기본 정보</CardTitle>
          <TextField
            label="앱 이름"
            value={draft.name}
            maxLength={30}
            onChange={event => update('name', event.currentTarget.value)}
            hint={isFigmaPreview ? 'Figma 미리보기 샘플 이름입니다. 실제 저장 시에는 이 이름만 전송합니다.' : '앞뒤 공백을 제외하고 1~30자로 입력해 주세요. 현재 계약은 이 이름만 저장합니다.'}
          />
        </Card>}

      </Page>

      {dialog && <DialogBackdrop onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}>
        <Dialog role="dialog" aria-modal="true" aria-labelledby="source-dialog-title" aria-describedby="source-dialog-copy">
          <DialogTitle id="source-dialog-title">이 소스는 준비 중입니다</DialogTitle>
          <DialogCopy id="source-dialog-copy">
            {dialog === 'unsupported-source' ? <>
              <span>현재 공개 앱 API 계약은 앱 이름만 지원하고, 저장소·이미지·압축 파일 소스 설정은 정의하지 않았습니다.</span>
              <span>GitHub 소스 화면을 미리 보려면 GitHub 저장소를 선택해 주세요.</span>
            </> : null}
          </DialogCopy>
          <DialogActions>
            <Button variant="secondary" onClick={() => setDialog(null)}>닫기</Button>
          </DialogActions>
        </Dialog>
      </DialogBackdrop>}
    </StudentShell>
  );
}
