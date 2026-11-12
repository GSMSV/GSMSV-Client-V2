import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { createPersonalApp } from '../../features/app/create-app';
import { checkAppSubdomain, useAppServiceDraft, type AppServiceType } from '../../features/app/create-app/service';
import { getSessionUser } from '../../entities/session';
import { ApiRequestError } from '../../shared/api';
import { Button, SegmentedControl, SliderField, StepIndicator, TextField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`
  display: flex;
  width: 100%;
  max-width: 1224px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;

  @media (max-width: 760px) { padding: 24px; }
`;

const PageMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Breadcrumb = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const PreviewBadge = styled.span`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Heading = styled.h1`
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

  @media (max-width: 760px) { flex-wrap: wrap; }
`;

const Steps = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`;

const StepLine = styled.span`
  width: 36px;
  height: 1px;
  flex: 0 0 36px;
  background: ${({ theme }) => theme.colors.border};
`;

const StepActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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

const CardHeader = styled.div`
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

const QuotaMeta = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  text-align: right;
`;

const Hint = styled.p<{ $tone?: 'normal' | 'error' | 'success' }>`
  margin: 0;
  color: ${({ theme, $tone }) => $tone === 'error' ? theme.colors.danger : $tone === 'success' ? theme.colors.primary : theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const ResourceFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PreviewBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
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
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 48px #0006;
`;

const DialogHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DialogIcon = styled.span<{ $tone: 'warning' | 'neutral' }>`
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $tone }) => $tone === 'warning' ? theme.colors.warning : theme.colors.primary};
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

type DialogKind = 'domain-unavailable' | null;
type AvailabilityState = 'idle' | 'loading' | 'available' | 'unavailable' | 'error';

const serviceOptions = [
  { value: 'web', label: '웹' },
  { value: 'worker', label: '워커' },
  { value: 'cron', label: '크론' },
] as const;

function isValidSubdomain(value: string) {
  return value.length >= 3 && value.length <= 63 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && !value.includes('--');
}

function serviceDescription(type: AppServiceType) {
  if (type === 'worker') return '워커는 주소 없이 계속 실행됩니다.';
  if (type === 'cron') return '크론은 정한 시간에 실행됩니다.';
  return '웹은 주소로 요청을 받습니다.';
}

export default function AppCreateServicePage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const { draft, update } = useAppServiceDraft();
  const previewOnly = import.meta.env.DEV;
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const [availabilityError, setAvailabilityError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<{ message: string; login?: boolean } | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const subdomainInputId = 'app-service-subdomain';

  useEffect(() => () => requestController.current?.abort(), []);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'apps') navigate('/apps');
  };

  const checkSubdomain = useCallback(async () => {
    const value = draft.subdomain.trim();
    if (!isValidSubdomain(value)) {
      setAvailability('unavailable');
      setAvailabilityError('영문 소문자와 숫자로 시작·끝나는 3~63자의 이름을 입력해 주세요. 하이픈은 중간에만 쓸 수 있습니다.');
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setAvailability('loading');
    setAvailabilityError('');
    try {
      const result = await checkAppSubdomain(value, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.available) {
        setAvailability('unavailable');
        setAvailabilityError(result.reason === 'invalid_format' ? '주소 형식이 올바르지 않습니다.' : '현재 사용할 수 없는 주소입니다.');
        setDialog('domain-unavailable');
      } else {
        setAvailability('available');
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setAvailability('error');
      setAvailabilityError(error instanceof ApiRequestError && error.status === 429
        ? '주소 확인 요청이 많습니다. 잠시 후 다시 확인해 주세요.'
        : '주소 사용 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [draft.subdomain]);

  const handleCreate = async () => {
    const name = draft.appName.trim();
    if (creating || name.length < 1 || name.length > 30) return;
    setCreating(true);
    setCreateError(null);
    try {
      const app = await createPersonalApp(name);
      sessionStorage.removeItem('gsmsv.app-create-source-draft');
      navigate(`/apps/${encodeURIComponent(app.grn)}`);
    } catch (error) {
      setCreateError(error instanceof ApiRequestError && error.status === 401
        ? { message: '로그인이 필요합니다. 로그인한 뒤 다시 시도해 주세요.', login: true }
        : error instanceof ApiRequestError && error.status === 409
          ? { message: '개인 앱 생성 한도에 도달했거나 요청이 충돌했습니다. Apps 목록에서 사용량을 확인해 주세요.' }
          : error instanceof ApiRequestError && error.status === 400
            ? { message: '앱 이름을 확인해 주세요. 앞뒤 공백을 제외하고 1~30자로 입력할 수 있습니다.' }
            : { message: '앱을 만들지 못했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.' });
    } finally {
      setCreating(false);
    }
  };

  const updateSubdomain = (value: string) => {
    update('subdomain', value.toLowerCase());
    setAvailability('idle');
    setAvailabilityError('');
  };

  const dialogCopy = {
    title: '서브도메인을 쓸 수 없습니다',
    description: '현재 사용할 수 없는 주소입니다. 다른 이름을 선택해 주세요. 주소를 점유한 사용자나 앱 정보는 공개할 수 없습니다.',
    tone: 'warning' as const,
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
        <PageMeta>
          <Breadcrumb>Apps</Breadcrumb>
          {previewOnly && <PreviewBadge>Figma 미리보기 샘플 · 실제 설정값 아님</PreviewBadge>}
        </PageMeta>
        <Heading>어떤 서비스로 실행하시겠습니까?</Heading>

        <StepRow>
          <Steps aria-label="앱 만들기 단계">
            <StepIndicator number={1} label="소스" />
            <StepLine role="presentation" />
            <StepIndicator number={2} label="서비스" active />
          </Steps>
          <StepActions>
            <Button variant="ghost" icon={<Octicon name="arrow-left" size={16} />} onClick={() => navigate('/apps/new')}>이전: 소스</Button>
            <Button variant="primary" icon={<Octicon name={creating ? 'sync' : 'check'} size={16} />} onClick={() => void handleCreate()} disabled={creating || draft.appName.trim().length < 1 || draft.appName.trim().length > 30}>{creating ? '앱 만드는 중' : '앱 만들기'}</Button>
          </StepActions>
        </StepRow>

        {createError && <PreviewBlock role="alert">
          <Octicon name="alert" size={16} aria-hidden="true" />
          <span>{createError.message}</span>
          {createError.login && <Button variant="secondary" onClick={() => navigate('/login')}>로그인</Button>}
        </PreviewBlock>}

        <PreviewBlock role="note">
          <Octicon name="info" size={16} aria-hidden="true" />
          <span>앱 이름 {draft.appName || '미입력'}으로 만들 수 있습니다. 현재 API 계약은 이름만 저장하고 기본 production 환경을 만들며, 이 화면의 소스와 서비스 설정은 전송되지 않습니다.</span>
        </PreviewBlock>

        <Card>
          <CardTitle>서비스</CardTitle>
          <SegmentedControl
            label="서비스 유형"
            options={[...serviceOptions]}
            value={draft.serviceType}
            disabled={!previewOnly}
            onChange={value => update('serviceType', value as AppServiceType)}
          />
          <Hint>{serviceDescription(draft.serviceType)}</Hint>
          <TextField
            label="서비스 이름"
            value={draft.serviceName}
            maxLength={30}
            disabled={!previewOnly}
            onChange={event => update('serviceName', event.currentTarget.value)}
            hint="앱 안에서 서비스를 구분하는 이름입니다."
          />
        </Card>

        {draft.serviceType === 'web' && <Card>
          <CardTitle>주소</CardTitle>
          <TextField
            id={subdomainInputId}
            label="서브도메인"
            value={draft.subdomain}
            maxLength={63}
            disabled={!previewOnly}
            onChange={event => updateSubdomain(event.currentTarget.value)}
            onBlur={() => { if (draft.subdomain.trim()) void checkSubdomain(); }}
            hint={`production 주소의 이름입니다. 실제 도메인 주소는 계약에 정의되어 있지 않습니다.`}
            error={availability === 'unavailable' ? availabilityError : undefined}
          />
          {availability === 'loading' && <Hint role="status">주소를 확인하고 있습니다…</Hint>}
          {availability === 'available' && <Hint $tone="success" role="status">현재 사용할 수 있는 이름입니다.</Hint>}
          {availability === 'error' && <Hint $tone="error" role="alert">{availabilityError}</Hint>}
        </Card>}

        <Card>
          <CardHeader>
            <CardTitle>자원</CardTitle>
            <QuotaMeta>{previewOnly ? '메모리 할당량 1 / 2 GB 사용 중 · 남은 할당량 1 GB · 미리보기 샘플' : '메모리 할당량 API가 없어 값을 확인할 수 없습니다.'}</QuotaMeta>
          </CardHeader>
          <ResourceFields>
            <SliderField
              label="메모리"
              value={draft.memoryMb}
              min={256}
              max={1024}
              step={128}
              minLabel="최소 256 MB"
              maxLabel="최대 1 GB"
              valueLabel={draft.memoryMb >= 1024 ? '1 GB' : `${draft.memoryMb} MB`}
              disabled={!previewOnly}
              onChange={value => update('memoryMb', value)}
            />
            <SliderField
              label="CPU"
              value={draft.cpu}
              min={0.25}
              max={1}
              step={0.25}
              minLabel="최소 0.25 vCPU"
              maxLabel="최대 1 vCPU"
              valueLabel={`${draft.cpu} vCPU`}
              disabled={!previewOnly}
              onChange={value => update('cpu', value)}
            />
          </ResourceFields>
          <Hint>컨테이너 안 파일은 재시작하면 사라집니다. 남길 데이터는 Database에 저장하세요.</Hint>
        </Card>
      </Page>

      {dialog && <DialogBackdrop onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}>
        <Dialog role="dialog" aria-modal="true" aria-labelledby="app-service-dialog-title" aria-describedby="app-service-dialog-copy">
          <DialogHeading>
            <DialogIcon $tone={dialogCopy.tone} aria-hidden="true">
              <Octicon name={dialogCopy.tone === 'warning' ? 'globe' : 'info'} size={20} />
            </DialogIcon>
            <DialogTitle id="app-service-dialog-title">{dialogCopy.title}</DialogTitle>
          </DialogHeading>
          <DialogCopy id="app-service-dialog-copy">{dialogCopy.description}</DialogCopy>
          <DialogActions>
            {dialog === 'domain-unavailable'
              ? <Button variant="secondary" onClick={() => { setDialog(null); document.getElementById(subdomainInputId)?.focus(); }}>다른 이름 쓰기</Button>
              : <Button variant="secondary" onClick={() => setDialog(null)}>확인</Button>}
          </DialogActions>
        </Dialog>
      </DialogBackdrop>}
    </StudentShell>
  );
}
