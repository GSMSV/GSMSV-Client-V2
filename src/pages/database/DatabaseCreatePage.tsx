import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import {
  createPersonalDatabase,
  listDatabases,
  type DatabaseEngine,
  type DatabaseSummary,
} from '../../entities/database';
import { getMyDatabaseQuota, type DatabaseQuota } from '../../entities/quota';
import { getSessionUser } from '../../entities/session';
import { ApiRequestError } from '../../shared/api';
import { Button } from '../../shared/ui/controls';
import { UsageCard } from '../../shared/ui/data-display';
import { ErrorCard, LoadingCard } from '../../shared/ui/feedback';
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
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family}, sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

const Summary = styled.section`
  display: flex;
  gap: 16px;

  @media (max-width: 960px) { flex-wrap: wrap; }
`;

const FlexibleUsageCard = styled(UsageCard)`
  min-width: 0;
  flex: 1 1 0;
`;

const FormCard = styled.section`
  display: flex;
  width: 100%;
  max-width: 864px;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const FormTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const EngineChoices = styled.div`
  display: flex;
  width: 100%;
  max-width: 816px;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const EngineButton = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  min-width: 0;
  min-height: 42px;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme, $selected }) => $selected ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $selected }) => $selected ? theme.colors.primary : theme.colors.text};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
  cursor: pointer;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Field = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;

  &::placeholder { color: ${({ theme }) => theme.colors.faint}; }
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Help = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  max-width: 864px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Quiet = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const Retry = styled.button`
  margin-left: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font: inherit;
  cursor: pointer;
`;

const DialogBackdrop = styled.div`
  position: fixed;
  z-index: 10;
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

const DialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

type DialogState = 'count' | 'storage' | 'postgres' | 'failure' | 'accepted' | null;
interface Loadable<T> { value: T | null; loading: boolean; error: boolean; }
const initialLoadable = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(value);
}

function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DatabaseCreatePage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [quota, setQuota] = useState<Loadable<DatabaseQuota>>(initialLoadable);
  const [databases, setDatabases] = useState<Loadable<DatabaseSummary[]>>(initialLoadable);
  const [retryKey, setRetryKey] = useState(0);
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<DatabaseEngine>('mysql');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const requestKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setQuota(current => ({ ...current, loading: true, error: false }));
    setDatabases(current => ({ ...current, loading: true, error: false }));
    void getMyDatabaseQuota(controller.signal).then(value => {
      if (!controller.signal.aborted) setQuota({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setQuota({ value: null, loading: false, error: true });
    });
    void listDatabases({ owner: 'me', signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setDatabases({ value, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setDatabases({ value: null, loading: false, error: true });
    });
    return () => controller.abort();
  }, [retryKey]);

  const count = quota.value?.db.count;
  const storage = quota.value?.db.shared_storage_gb;
  const writeLocked = databases.value?.some(database => database.write_locked) ?? false;
  const needsQuotaCheck = quota.loading || databases.loading || quota.error || databases.error;
  const nameIsValid = name.trim().length >= 1 && name.trim().length <= 30;
  const canSubmit = useMemo(() => nameIsValid && !submitting, [nameIsValid, submitting]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'database') navigate('/databases');
  };

  const submit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 30) {
      setNameError('이름은 1자 이상 30자 이하로 입력해 주세요.');
      return;
    }
    setNameError('');
    if (needsQuotaCheck) {
      setNameError('사용량 정보를 확인한 뒤 발급할 수 있습니다.');
      return;
    }
    if (count && count.used >= count.limit) { setDialog('count'); return; }
    if ((storage && storage.used > storage.limit) || writeLocked) { setDialog('storage'); return; }

    setSubmitting(true);
    const fingerprint = `${engine}\u0000${trimmedName}`;
    if (requestKeyRef.current?.fingerprint !== fingerprint) {
      requestKeyRef.current = { fingerprint, key: newIdempotencyKey() };
    }
    try {
      await createPersonalDatabase(trimmedName, engine, { idempotencyKey: requestKeyRef.current.key });
      requestKeyRef.current = null;
      setDialog('accepted');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status !== null && error.status < 500) {
        requestKeyRef.current = null;
      }
      if (error instanceof ApiRequestError && error.code === 'QUOTA_EXCEEDED') setDialog('count');
      else if (error instanceof ApiRequestError && error.code === 'WRITE_LOCKED_OWNER') setDialog('storage');
      else setDialog('failure');
    } finally {
      setSubmitting(false);
    }
  }, [count, engine, name, needsQuotaCheck, storage, writeLocked]);

  const dialogContent = {
    count: { title: 'Database를 더 발급할 수 없습니다', copy: `개인 Database 발급 한도 ${count ? `${formatNumber(count.used)} / ${formatNumber(count.limit)}` : ''}에 도달했습니다. 사용하지 않는 Database를 정리한 뒤 다시 시도해 주세요.` },
    storage: { title: '용량을 먼저 줄여 주세요', copy: `공유 용량을 초과했거나 쓰기 잠금 상태입니다. 현재 사용량 ${storage ? `${formatNumber(storage.used)} / ${formatNumber(storage.limit)} GB` : '정보 확인 필요'}을 확인하고 기존 Database의 용량을 줄여 주세요.` },
    postgres: { title: '지금은 MySQL만 발급할 수 있습니다', copy: 'PostgreSQL 발급은 아직 준비 중입니다. MySQL을 선택해 주세요.' },
    failure: { title: 'Database 발급 요청에 실패했습니다', copy: '잠시 후 다시 시도해 주세요. 문제가 계속되면 Database 목록에서 상태를 확인해 주세요.' },
    accepted: { title: '발급 요청을 보냈습니다', copy: 'Database가 준비되는 동안 목록에서 상태를 확인할 수 있습니다. 준비가 끝나면 상세 화면에서 접속 정보를 확인하세요.' },
  };

  return (
    <StudentShell
      activeItem="database"
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
        <Breadcrumb>Database</Breadcrumb>
        <Heading>
          <TitleGroup>
            <Title>새 Database 발급</Title>
            <Description>엔진과 이름을 정하면 발급 요청을 보냅니다.</Description>
          </TitleGroup>
          <Actions>
            <Button variant="secondary" onClick={() => navigate('/databases')}>취소</Button>
            <Button variant="primary" icon={<Octicon name="plus" size={16} />} onClick={() => void submit()} disabled={!canSubmit || needsQuotaCheck}>
              {submitting ? '요청 중…' : '발급'}
            </Button>
          </Actions>
        </Heading>

        <Notice role="note">
          <Octicon name="info" size={18} />
          <span>개인 Database를 발급합니다. 요청이 접수된 뒤 준비 상태가 목록에 표시되며, 접속 정보는 준비 완료 후 상세 화면에서 확인할 수 있습니다.</span>
        </Notice>

        <Summary aria-label="Database 사용량">
          {quota.loading ? <><LoadingCard height={152} /><LoadingCard height={152} /></> : (
            <>
              <FlexibleUsageCard
                label="내 Database"
                icon={<Octicon name="database" size={16} />}
                value={count ? `${formatNumber(count.used)} / ${formatNumber(count.limit)}` : <Quiet>— / —</Quiet>}
                meter={count && count.limit > 0 ? { value: Math.min(100, count.used / count.limit * 100), tone: count.used >= count.limit ? 'danger' : 'primary', label: 'Database 개수 사용량' } : undefined}
                caption={quota.error ? <>사용량을 불러오지 못했습니다<Retry type="button" onClick={() => setRetryKey(value => value + 1)}>다시 시도</Retry></> : count ? `발급하면 ${formatNumber(count.used + 1)} / ${formatNumber(count.limit)}개가 됩니다` : '개인 Database 발급 한도'}
              />
              <FlexibleUsageCard
                label="사용 용량"
                icon={<Octicon name="graph" size={16} />}
                value={storage ? `${formatNumber(storage.used)} / ${formatNumber(storage.limit)} GB` : <Quiet>— / — GB</Quiet>}
                meter={storage && storage.limit > 0 ? { value: Math.min(100, storage.used / storage.limit * 100), tone: storage.used > storage.limit ? 'danger' : 'primary', label: 'Database 용량 사용량' } : undefined}
                caption={quota.error ? <>사용량을 불러오지 못했습니다<Retry type="button" onClick={() => setRetryKey(value => value + 1)}>다시 시도</Retry></> : '내 Database가 사용하는 공유 용량'}
              />
            </>
          )}
        </Summary>

        {databases.error && <ErrorCard onRetry={() => setRetryKey(value => value + 1)} />}

        <FormCard>
          <FormTitle>Database 정보</FormTitle>
          <FormSection>
            <Label>엔진</Label>
            <EngineChoices role="group" aria-label="Database 엔진">
              <EngineButton type="button" $selected={engine === 'mysql'} aria-pressed={engine === 'mysql'} onClick={() => setEngine('mysql')}>MySQL</EngineButton>
              <EngineButton type="button" $selected={false} aria-disabled="true" onClick={() => setDialog('postgres')}>PostgreSQL</EngineButton>
            </EngineChoices>
          </FormSection>
          <FormSection>
            <Label htmlFor="database-name">이름</Label>
            <Field
              id="database-name"
              value={name}
              placeholder="예: shop-db"
              maxLength={30}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'database-name-help database-name-error' : 'database-name-help'}
              onChange={event => { setName(event.target.value); setNameError(''); }}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }}
            />
            <Help id="database-name-help">1~30자. 앞뒤 공백은 저장 전에 제거됩니다.</Help>
            {nameError && <Help id="database-name-error" role="alert">{nameError}</Help>}
          </FormSection>
          <Help>Database 이름은 발급 후에도 설정에서 변경할 수 있습니다.</Help>
        </FormCard>
      </Page>

      {dialog && <DialogBackdrop onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}>
        <Dialog role="dialog" aria-modal="true" aria-labelledby="database-dialog-title" aria-describedby="database-dialog-copy">
          <DialogTitle id="database-dialog-title">{dialogContent[dialog].title}</DialogTitle>
          <DialogCopy id="database-dialog-copy">{dialogContent[dialog].copy}</DialogCopy>
          <DialogActions>
            {dialog === 'storage' && <Button variant="secondary" onClick={() => { setDialog(null); navigate('/databases'); }}>Database 목록</Button>}
            {dialog === 'accepted' && <Button variant="primary" onClick={() => navigate('/databases')}>Database 목록</Button>}
            {dialog !== 'accepted' && <Button variant={dialog === 'failure' ? 'secondary' : 'primary'} onClick={() => setDialog(null)}>{dialog === 'failure' ? '닫기' : '확인'}</Button>}
          </DialogActions>
        </Dialog>
      </DialogBackdrop>}
    </StudentShell>
  );
}
