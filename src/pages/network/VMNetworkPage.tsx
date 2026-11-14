import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import {
  createDomain,
  createFirewallRule,
  createPortForward,
  deleteDomain,
  deleteFirewallRule,
  deletePortForward,
  listDomains,
  listFirewallRules,
  listPortForwards,
  restoreDefaultPortForwards,
  type Domain,
  type FirewallAction,
  type FirewallDirection,
  type FirewallProtocol,
  type FirewallRule,
  type NetworkProtocol,
  type PortForward,
} from '../../entities/network';
import { getDemoVmState } from '../../entities/vm';
import { getSessionUser } from '../../entities/session';
import { ApiRequestError } from '../../shared/api';
import { isDemoMode } from '../../shared/demo';
import { Button } from '../../shared/ui/controls';
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

const Breadcrumb = styled(Link)`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
  text-decoration: none;
`;

const Heading = styled.section`
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
  font: ${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Tabs = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  padding: 0 16px;
  border-radius: ${({ theme }) => theme.radii.base}px ${({ theme }) => theme.radii.base}px 0 0;
  background: ${({ theme, $active }) => $active ? theme.colors.primarySoft : 'transparent'};
  color: ${({ theme, $active }) => $active ? theme.colors.primary : theme.colors.muted};
  font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  text-decoration: none;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
`;

const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`;

const BannerText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const BannerCaption = styled.span`
  color: ${({ theme }) => theme.colors.faint};
`;

const Surface = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const ErrorPanel = styled(ErrorCard)<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const SectionActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: ${({ theme }) => theme.radii.base}px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  text-align: left;

  thead { background: ${({ theme }) => theme.colors.raised}; }
  th { color: ${({ theme }) => theme.colors.muted}; font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif; }
  th, td { padding: 12px; white-space: nowrap; }
  tbody tr + tr { border-top: 1px solid ${({ theme }) => theme.colors.border}; }
`;

const TableActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconButton = styled.button`
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.overlayHover}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 2px; }
  &:disabled { color: ${({ theme }) => theme.colors.faint}; cursor: not-allowed; }
`;

const Synced = styled.span<{ $status: 'synced' | 'pending' | 'failed' }>`
  color: ${({ theme, $status }) => $status === 'synced' ? theme.colors.primary : $status === 'failed' ? theme.colors.danger : theme.colors.warning};
`;

const RuleAction = styled.span<{ $allowed: boolean }>`
  color: ${({ theme, $allowed }) => $allowed ? theme.colors.primary : theme.colors.muted};
`;

const FirewallControl = styled.div<{ $enabled: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

`;

const SwitchTrack = styled.span<{ $enabled: boolean }>`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex: 0 0 44px;
  border-radius: 12px;
  background: ${({ theme, $enabled }) => $enabled ? theme.colors.primary : theme.colors.raised};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

const SwitchThumb = styled.span<{ $enabled: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ $enabled }) => $enabled ? '23px' : '3px'};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.onPrimary};
`;

const FirewallFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 4px;
`;

const Muted = styled.span`
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const Overlay = styled.div`
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
  max-height: min(90vh, 760px);
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 16px 48px #0006;
`;

const DialogTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family}, sans-serif;
`;

const DialogCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const FieldGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  &::placeholder { color: ${({ theme }) => theme.colors.faint}; }
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Select = styled.select`
  box-sizing: border-box;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

const Segmented = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.raised};
`;

const Segment = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-height: 34px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background: ${({ theme, $active }) => $active ? theme.colors.surface : 'transparent'};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
  cursor: pointer;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;
`;

type Loadable<T> = { value: T | null; loading: boolean; error: boolean };
type ActionKind = 'port' | 'rule' | 'domain' | 'restore' | 'firewall-confirm' | 'firewall-loading' | 'firewall-error' | null;
type ConfirmTarget = { kind: 'port'; value: PortForward } | { kind: 'rule'; value: FirewallRule } | { kind: 'domain'; value: Domain } | null;

const initial = <T,>(): Loadable<T> => ({ value: null, loading: true, error: false });

function apiMessage(error: unknown, action: string) {
  if (!(error instanceof ApiRequestError)) return `${action} 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.`;
  switch (error.code) {
    case 'ACCESS_DENIED': return '이 작업을 수행할 권한이 없습니다.';
    case 'CONFLICT': return '외부 포트가 사용 중입니다. 다시 시도해 주세요.';
    case 'ALREADY_EXISTS': return '이미 사용 중인 서브도메인입니다.';
    case 'VM_NO_INTERNAL_IP': return 'VM 내부 주소가 준비된 뒤 다시 시도해 주세요.';
    case 'QUOTA_EXCEEDED': return 'VM의 네트워크 항목 한도에 도달했습니다.';
    case 'GATEWAY_SYNC_FAILED': return '게이트웨이 반영에 실패했습니다. 저장된 변경은 되돌려졌습니다.';
    case 'NO_FREE_PORT': return '사용 가능한 외부 포트가 없습니다.';
    case 'UPSTREAM_UNAVAILABLE': return '가상화 서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.';
    case 'NETWORK_ERROR': return '네트워크에 연결할 수 없습니다. 연결을 확인한 뒤 다시 시도해 주세요.';
    default: return `${action} 요청을 처리하지 못했습니다. (${error.code})`;
  }
}

function portLabel(port: PortForward) {
  if (port.kind === 'ssh') return 'SSH · 기본';
  if (port.kind === 'http') return 'HTTP · 기본';
  if (port.kind === 'svc') return 'SVC · 기본';
  return port.description || '사용자 지정';
}

function syncLabel(status: Domain['sync_status']) {
  if (status === 'synced') return '동기화됨';
  if (status === 'failed') return '실패';
  return '동기화 중';
}

function DialogFrame({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Overlay onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <Dialog role="dialog" aria-modal="true" aria-label={title}>
        <DialogTitle>{title}</DialogTitle>
        {children}
      </Dialog>
    </Overlay>
  );
}

export default function VMNetworkPage() {
  const { vmGrn, teamId: routeTeamId } = useParams<{ vmGrn: string; teamId?: string }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const demoVm = isDemoMode() ? getDemoVmState().vms.find(vm => vm.grn === vmGrn) : undefined;
  const teamId = routeTeamId ?? (demoVm?.owner === 'team' ? demoVm.teamId : undefined);
  const resourceVmId = encodeURIComponent(demoVm?.id ?? vmGrn ?? '');
  const resourceBase = teamId
    ? `/teams/${encodeURIComponent(teamId)}/vms/${resourceVmId}`
    : `/vms/${resourceVmId}`;
  const fallbackNetworkPath = teamId
    ? `/teams/${encodeURIComponent(teamId)}/vms/${encodeURIComponent(vmGrn ?? '')}/network`
    : `/vms/${encodeURIComponent(vmGrn ?? '')}/network`;
  const demoNavigationAvailable = Boolean(isDemoMode() && demoVm && (demoVm.owner !== 'team' || demoVm.teamId === teamId));
  const [ports, setPorts] = useState<Loadable<Awaited<ReturnType<typeof listPortForwards>>>>(initial);
  const [rules, setRules] = useState<Loadable<Awaited<ReturnType<typeof listFirewallRules>>>>(initial);
  const [domains, setDomains] = useState<Loadable<Awaited<ReturnType<typeof listDomains>>>>(initial);
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState<ActionKind>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [portForm, setPortForm] = useState({ internalPort: '', protocol: 'tcp' as NetworkProtocol, allowedSource: '', description: '' });
  const [ruleForm, setRuleForm] = useState({ action: 'accept' as FirewallAction, direction: 'in' as FirewallDirection, protocol: 'tcp' as FirewallProtocol, dport: '', source: '' });
  const [domainForm, setDomainForm] = useState({ subdomain: '', internalPort: '' });

  const load = useCallback(async (signal: AbortSignal) => {
    if (!vmGrn) {
      setPorts({ value: null, loading: false, error: true });
      setRules({ value: null, loading: false, error: true });
      setDomains({ value: null, loading: false, error: true });
      return;
    }
    setPorts(current => ({ ...current, loading: true, error: false }));
    setRules(current => ({ ...current, loading: true, error: false }));
    setDomains(current => ({ ...current, loading: true, error: false }));
    const [portResult, ruleResult, domainResult] = await Promise.allSettled([
      listPortForwards(vmGrn, signal), listFirewallRules(vmGrn, signal), listDomains(vmGrn, signal),
    ]);
    if (signal.aborted) return;
    setPorts(portResult.status === 'fulfilled' ? { value: portResult.value, loading: false, error: false } : { value: null, loading: false, error: true });
    setRules(ruleResult.status === 'fulfilled' ? { value: ruleResult.value, loading: false, error: false } : { value: null, loading: false, error: true });
    setDomains(domainResult.status === 'fulfilled' ? { value: domainResult.value, loading: false, error: false } : { value: null, loading: false, error: true });
  }, [vmGrn]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const reload = () => setReloadKey(value => value + 1);
  const firewallEnabled = rules.value?.enabled ?? false;
  const customPortCount = ports.value?.items.filter(port => port.kind === 'custom').length ?? 0;
  const portsRemaining = Math.max(0, (ports.value?.limits.custom ?? 0) - customPortCount);
  const domainRemaining = Math.max(0, (domains.value?.limits.per_vm ?? 0) - (domains.value?.items.length ?? 0));
  const ruleRemaining = Math.max(0, (rules.value?.limits.per_vm ?? 0) - (rules.value?.items.length ?? 0));
  const busy = ports.loading || rules.loading || domains.loading;
  const hasUnsavedInput = Boolean(
    (action === 'port' && (portForm.internalPort || portForm.allowedSource || portForm.description || portForm.protocol !== 'tcp'))
    || ((action === 'rule' || action?.startsWith('firewall-')) && (
      ruleForm.dport || ruleForm.source || ruleForm.action !== 'accept'
      || ruleForm.direction !== 'in' || ruleForm.protocol !== 'tcp'
    ))
    || (action === 'domain' && (domainForm.subdomain || domainForm.internalPort)),
  );
  const expectedInternalPort = useMemo(() => Number.parseInt(domainForm.internalPort, 10), [domainForm.internalPort]);

  const navigateFromShell = (item: Exclude<StudentNavigationKey, 'none'>) => {
    if (item === 'home') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}` : '/');
    if (item === 'team') navigate(teamId ? `/teams/${encodeURIComponent(teamId)}` : '/teams');
    if (item === 'apps') navigate('/apps');
    if (item === 'database') navigate('/databases');
  };

  const finishAction = () => {
    setAction(null);
    setConfirmTarget(null);
    setError('');
    setSubmitting(false);
    setPortForm({ internalPort: '', protocol: 'tcp', allowedSource: '', description: '' });
    setRuleForm({ action: 'accept', direction: 'in', protocol: 'tcp', dport: '', source: '' });
    setDomainForm({ subdomain: '', internalPort: '' });
  };

  const handleActionError = (cause: unknown, label: string) => setError(apiMessage(cause, label));

  async function submitPort(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vmGrn) return;
    const internalPort = Number.parseInt(portForm.internalPort, 10);
    if (!Number.isInteger(internalPort) || internalPort < 1 || internalPort > 65535) {
      setError('내부 포트는 1부터 65535 사이의 숫자여야 합니다.'); return;
    }
    setSubmitting(true); setError('');
    try {
      await createPortForward(vmGrn, {
        internal_port: internalPort,
        protocol: portForm.protocol,
        ...(portForm.allowedSource.trim() ? { allowed_source: portForm.allowedSource.trim() } : {}),
        ...(portForm.description.trim() ? { description: portForm.description.trim() } : {}),
      });
      setNotice('외부 접속 포트를 추가했습니다.'); finishAction(); reload();
    } catch (cause) { handleActionError(cause, '포트 추가'); setSubmitting(false); }
  }

  async function submitRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vmGrn) return;
    if (ruleForm.protocol !== 'icmp' && !ruleForm.dport.trim()) { setError('포트 또는 포트 범위를 입력해 주세요.'); return; }
    if (ruleForm.protocol !== 'icmp' && !/^(?:[1-9]\d{0,4})(?::(?:[1-9]\d{0,4}))?$/.test(ruleForm.dport.trim())) {
      setError('포트는 1~65535 숫자 하나 또는 시작:끝 범위로 입력해 주세요.'); return;
    }
    if (ruleForm.protocol !== 'icmp') {
      const [startPort, endPort = startPort] = ruleForm.dport.split(':').map(Number);
      if (startPort > 65535 || endPort > 65535 || endPort < startPort) { setError('포트 범위는 1~65535이고 끝 포트가 시작 포트보다 커야 합니다.'); return; }
    }
    setError('');
    setAction('firewall-confirm');
  }

  async function confirmFirewallRule() {
    if (!vmGrn) return;
    setSubmitting(true); setError(''); setAction('firewall-loading');
    try {
      await createFirewallRule(vmGrn, {
        action: ruleForm.action,
        direction: ruleForm.direction,
        protocol: ruleForm.protocol,
        ...(ruleForm.dport.trim() && ruleForm.protocol !== 'icmp' ? { dport: ruleForm.dport.trim() } : {}),
        ...(ruleForm.source.trim() ? { source: ruleForm.source.trim() } : {}),
      });
      setNotice('방화벽 규칙을 추가했습니다. 방화벽이 켜졌습니다.'); finishAction(); reload();
    } catch (cause) { handleActionError(cause, '방화벽 켜기'); setSubmitting(false); setAction('firewall-error'); }
  }

  async function submitDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vmGrn) return;
    const subdomain = domainForm.subdomain.trim();
    if (!/^[a-z0-9-]{1,63}$/.test(subdomain)) { setError('서브도메인은 영문 소문자, 숫자, 하이픈으로 1~63자 입력해 주세요.'); return; }
    if (!Number.isInteger(expectedInternalPort) || expectedInternalPort < 1 || expectedInternalPort > 65535) { setError('내부 포트는 1부터 65535 사이의 숫자여야 합니다.'); return; }
    setSubmitting(true); setError('');
    try {
      await createDomain(vmGrn, { subdomain, internal_port: expectedInternalPort });
      setNotice('HTTPS Domain을 연결했습니다.'); finishAction(); reload();
    } catch (cause) { handleActionError(cause, 'Domain 추가'); setSubmitting(false); }
  }

  async function restoreDefaults() {
    if (!vmGrn) return;
    setSubmitting(true); setError('');
    try {
      const result = await restoreDefaultPortForwards(vmGrn);
      setNotice(result.restored ? `기본 포트 ${result.restored}개를 복원했습니다.` : '기본 포트가 이미 모두 있습니다.');
      finishAction(); reload();
    } catch (cause) { handleActionError(cause, '기본 포트 복원'); setSubmitting(false); }
  }

  async function confirmDelete() {
    if (!vmGrn || !confirmTarget) return;
    setSubmitting(true); setError('');
    try {
      if (confirmTarget.kind === 'port') await deletePortForward(vmGrn, confirmTarget.value.id);
      else if (confirmTarget.kind === 'rule') await deleteFirewallRule(vmGrn, confirmTarget.value.id);
      else await deleteDomain(vmGrn, confirmTarget.value.id);
      setNotice(`${confirmTarget.kind === 'port' ? '외부 접속 포트' : confirmTarget.kind === 'rule' ? '방화벽 규칙' : 'HTTPS Domain'}을 삭제했습니다.`);
      finishAction(); reload();
    } catch (cause) { handleActionError(cause, '삭제'); setSubmitting(false); }
  }

  const openAction = (kind: ActionKind) => { setAction(kind); setError(''); setSubmitting(false); };

  const publicHost = ports.value?.public_host;
  const userName = demoVm?.owner === 'team' ? '윤채원' : user?.name ?? '사용자';

  if (isDemoMode() && routeTeamId && (!demoVm || demoVm.owner !== 'team' || demoVm.teamId !== routeTeamId)) {
    return <Navigate to={`/teams/${encodeURIComponent(routeTeamId)}/vms`} replace />;
  }
  if (isDemoMode() && demoVm?.owner === 'team' && !routeTeamId && demoVm.teamId) {
    return <Navigate to={`/teams/${encodeURIComponent(demoVm.teamId)}/vms/${encodeURIComponent(demoVm.id)}/network`} replace />;
  }

  return (
    <StudentShell
      activeItem="home"
      scopeLabel={teamId && demoVm?.owner === 'team' ? `${demoVm.teamName ?? '팀'} · 일반 팀원` : '내 Resources'}
      userName={userName}
      scopeDisabled
      scopeDisabledReason={teamId ? '팀 VM Network 화면에서는 현재 팀 범위를 유지합니다.' : 'VM 소유 범위 정보가 제공되지 않아 범위를 변경할 수 없습니다.'}
      onNavigate={navigateFromShell}
      onCreateTeam={() => navigate('/teams/new')}
      onOpenStatus={() => navigate('/status')}
      onSelectScope={() => undefined}
      onSearch={() => undefined}
      onOpenNotifications={() => undefined}
      hasUnsavedInput={hasUnsavedInput}
    >
      <Page>
        <Breadcrumb to={teamId ? `/teams/${encodeURIComponent(teamId)}` : '/'}>{teamId && demoVm?.owner === 'team' ? `${demoVm.teamName ?? '팀'} / 팀 Resources` : '워크스페이스 / 내 Resources'}</Breadcrumb>
        <Heading>
          <Title>VM Network</Title>
          <Subtitle>외부 접속과 트래픽 규칙 관리</Subtitle>
        </Heading>
        <Tabs aria-label="VM navigation">
          <Tab to={demoNavigationAvailable ? resourceBase : fallbackNetworkPath} aria-disabled={!demoNavigationAvailable} title={!demoNavigationAvailable ? 'VM 개요 API 계약이 없어 이 화면은 아직 연결되지 않았습니다.' : undefined} onClick={!demoNavigationAvailable ? event => event.preventDefault() : undefined}>개요</Tab>
          <Tab to={demoNavigationAvailable ? `${resourceBase}/monitoring` : fallbackNetworkPath} aria-disabled={!demoNavigationAvailable} title={!demoNavigationAvailable ? 'VM Monitoring API 계약이 없어 이 화면은 아직 연결되지 않았습니다.' : undefined} onClick={!demoNavigationAvailable ? event => event.preventDefault() : undefined}>Monitoring</Tab>
          <Tab to={fallbackNetworkPath} $active>Network</Tab>
          <Tab to={demoNavigationAvailable ? `${resourceBase}/snapshots` : fallbackNetworkPath} aria-disabled={!demoNavigationAvailable} title={!demoNavigationAvailable ? 'VM Snapshot API 계약이 없어 이 화면은 아직 연결되지 않았습니다.' : undefined} onClick={!demoNavigationAvailable ? event => event.preventDefault() : undefined}>Snapshot</Tab>
          <Tab to={demoNavigationAvailable ? `${resourceBase}/settings` : fallbackNetworkPath} aria-disabled={!demoNavigationAvailable} title={!demoNavigationAvailable ? 'VM 설정 API 계약이 없어 이 화면은 아직 연결되지 않았습니다.' : undefined} onClick={!demoNavigationAvailable ? event => event.preventDefault() : undefined}>설정</Tab>
        </Tabs>

        <Banner>
          <Octicon name="info" size={20} aria-hidden="true" />
          <BannerText>
            <strong>접속 경로와 허용 규칙을 따로 관리합니다</strong>
            <BannerCaption>외부 접속 포트와 HTTPS Domain은 들어오는 길을 만들고, 방화벽은 들어온 트래픽을 거릅니다.</BannerCaption>
          </BannerText>
        </Banner>
        {notice && <Banner role="status"><Octicon name="check-circle" size={20} /><BannerText>{notice}</BannerText></Banner>}

        {ports.error ? <ErrorPanel $height={248} onRetry={reload} /> : <Surface>
          <SectionHeading>
            <SectionTitle>외부 접속 포트{ports.value ? ` · 커스텀 ${customPortCount}/${ports.value.limits.custom}` : ''}</SectionTitle>
            <SectionActions>
              <Button variant="secondary" icon={<Octicon name="history" size={16} />} onClick={() => { setAction('restore'); setError(''); }}>기본 포트 복원</Button>
              <Button variant="primary" icon={<Octicon name="plus" size={16} />} disabled={portsRemaining <= 0 || !ports.value} onClick={() => openAction('port')}>포트 추가</Button>
            </SectionActions>
          </SectionHeading>
          {busy && <LoadingCard height={142} />}
          {!busy && ports.value && <TableWrap>
            <Table>
              <thead><tr><th>이름</th><th>내부 → 외부</th><th>프로토콜</th><th>출발지</th><th>관리</th></tr></thead>
              <tbody>
                {ports.value.items.length === 0 ? <tr><td colSpan={5}>등록된 포트포워딩이 없습니다.</td></tr> : ports.value.items.map(port => (
                  <tr key={port.id}>
                    <td>{portLabel(port)}</td>
                    <td>{port.internal_port} → {port.external_port}</td>
                    <td>{port.protocol.toUpperCase()}</td>
                    <td>{port.allowed_source ?? '0.0.0.0/0'}</td>
                    <td><TableActions>
                      {publicHost && <IconButton type="button" aria-label={`${portLabel(port)} 주소 복사`} title="주소 복사" onClick={() => void navigator.clipboard?.writeText(`${publicHost}:${port.external_port}`).then(() => setNotice('접속 주소를 복사했습니다.')).catch(() => setNotice('주소 복사에 실패했습니다.'))}><Octicon name="copy" size={16} /></IconButton>}
                      <IconButton type="button" aria-label={`${portLabel(port)} 삭제`} title="삭제" onClick={() => { setConfirmTarget({ kind: 'port', value: port }); setError(''); }}><Octicon name="trashcan" size={16} /></IconButton>
                    </TableActions></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>}
          {ports.value && <Muted>외부 주소: {publicHost ?? '계약 응답에 호스트 정보가 없습니다.'}</Muted>}
        </Surface>}

        {rules.error ? <ErrorPanel $height={240} onRetry={reload} /> : <Surface>
          <SectionHeading>
            <SectionTitle>방화벽 규칙 · {rules.value ? firewallEnabled ? '켜짐' : '꺼짐' : '—'}</SectionTitle>
            <SectionActions>
              <Button variant="primary" icon={<Octicon name="plus" size={16} />} disabled={ruleRemaining <= 0 || !rules.value} onClick={() => openAction('rule')}>규칙 추가</Button>
            </SectionActions>
          </SectionHeading>
          {busy && <LoadingCard height={160} />}
          {!busy && rules.value && <>
            <TableWrap>
              <Table>
                <thead><tr><th>동작 · 방향</th><th>프로토콜 · 포트</th><th>출발지</th><th>목적지</th><th>관리</th></tr></thead>
                <tbody>
                  {rules.value.items.length === 0 ? <tr><td colSpan={5}>등록된 방화벽 규칙이 없습니다.</td></tr> : rules.value.items.map(rule => (
                    <tr key={rule.id}>
                      <td><RuleAction $allowed={rule.action === 'accept'}>{rule.action === 'accept' ? '허용' : rule.action === 'drop' ? '차단' : '거부'} · {rule.direction === 'in' ? '수신' : '송신'}</RuleAction></td>
                      <td>{rule.protocol.toUpperCase()}{rule.dport ? ` · ${rule.dport}` : ''}</td>
                      <td>{rule.source ?? '전체'}</td>
                      <td aria-label="목적지 정보는 목록 API 응답에 없습니다">—</td>
                      <td><TableActions><IconButton type="button" aria-label="방화벽 규칙 삭제" title="삭제" onClick={() => { setConfirmTarget({ kind: 'rule', value: rule }); setError(''); }}><Octicon name="trashcan" size={16} /></IconButton></TableActions></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <FirewallFoot>
              <Muted>수신은 허용한 규칙만 통과하고 송신은 허용됩니다. 끄면 모든 수신 접속이 허용되므로 확인이 필요합니다.</Muted>
              <FirewallControl $enabled={firewallEnabled} role="switch" aria-checked={firewallEnabled} aria-label="방화벽 사용 상태" aria-disabled="true" title="계약에 방화벽 켜기/끄기 API가 없습니다.">
                <SwitchTrack $enabled={firewallEnabled} aria-hidden="true"><SwitchThumb $enabled={firewallEnabled} /></SwitchTrack>
                {firewallEnabled ? '켜짐' : '꺼짐'}
              </FirewallControl>
            </FirewallFoot>
          </>}
        </Surface>}

        {domains.error ? <ErrorPanel $height={152} onRetry={reload} /> : <Surface>
          <SectionHeading>
            <SectionTitle>HTTPS Domain · {domains.value ? `${domains.value.items.length}/${domains.value.limits.per_vm}` : '—'}</SectionTitle>
            <SectionActions>
              <Button variant="primary" icon={<Octicon name="plus" size={16} />} disabled={domainRemaining <= 0 || !domains.value} onClick={() => openAction('domain')}>Domain 추가</Button>
            </SectionActions>
          </SectionHeading>
          {busy && <LoadingCard height={140} />}
          {!busy && domains.value && <TableWrap>
            <Table>
              <thead><tr><th>Domain</th><th>내부 포트</th><th>동기화</th><th>관리</th></tr></thead>
              <tbody>
                {domains.value.items.length === 0 ? <tr><td colSpan={4}>연결된 HTTPS Domain이 없습니다.</td></tr> : domains.value.items.map(domain => (
                  <tr key={domain.id}>
                    <td>{domain.url}</td>
                    <td>{domain.internal_port}</td>
                    <td><Synced $status={domain.sync_status}>{syncLabel(domain.sync_status)}</Synced></td>
                    <td><TableActions>
                      <IconButton as="a" href={domain.url} target="_blank" rel="noreferrer" aria-label="Domain 열기" title="열기"><Octicon name="link-external" size={16} /></IconButton>
                      <IconButton type="button" aria-label="Domain 주소 복사" title="복사" onClick={() => void navigator.clipboard?.writeText(domain.url).then(() => setNotice('Domain 주소를 복사했습니다.')).catch(() => setNotice('주소 복사에 실패했습니다.'))}><Octicon name="copy" size={16} /></IconButton>
                      <IconButton type="button" aria-label="Domain 삭제" title="삭제" onClick={() => { setConfirmTarget({ kind: 'domain', value: domain }); setError(''); }}><Octicon name="trashcan" size={16} /></IconButton>
                    </TableActions></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>}
        </Surface>}

      </Page>

      {action === 'port' && <DialogFrame title="외부 접속 포트 추가" onClose={finishAction}>
        <DialogCopy>VM 내부 포트로 들어오는 외부 접속을 연결합니다. 외부 포트는 서버가 자동으로 배정합니다.</DialogCopy>
        <Form onSubmit={event => void submitPort(event)}>
          <FieldGroup>내부 포트<Input type="number" min="1" max="65535" required value={portForm.internalPort} onChange={event => setPortForm(current => ({ ...current, internalPort: event.target.value }))} placeholder="예: 8080" /></FieldGroup>
          <FieldGroup>프로토콜<Select value={portForm.protocol} onChange={event => setPortForm(current => ({ ...current, protocol: event.target.value as NetworkProtocol }))}><option value="tcp">TCP</option><option value="udp">UDP</option></Select></FieldGroup>
          <FieldGroup>허용 출발지 (선택)<Input value={portForm.allowedSource} onChange={event => setPortForm(current => ({ ...current, allowedSource: event.target.value }))} placeholder="IP 또는 CIDR" /></FieldGroup>
          <FieldGroup>설명 (선택)<Input value={portForm.description} onChange={event => setPortForm(current => ({ ...current, description: event.target.value }))} placeholder="접속 목적" /></FieldGroup>
          {error && <InlineError role="alert">{error}</InlineError>}
          <DialogActions><Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={finishAction}>취소</Button><Button type="submit" variant="primary" icon={<Octicon name="plus" size={16} />} disabled={submitting}>{submitting ? '추가 중…' : '포트 추가'}</Button></DialogActions>
        </Form>
      </DialogFrame>}

      {action === 'rule' && <DialogFrame title="방화벽 규칙 추가" onClose={finishAction}>
        <Form onSubmit={event => void submitRule(event)}>
          <FieldGroup>동작<Segmented role="group" aria-label="규칙 동작">{(['accept', 'drop', 'reject'] as const).map(value => <Segment key={value} type="button" $active={ruleForm.action === value} aria-pressed={ruleForm.action === value} onClick={() => setRuleForm(current => ({ ...current, action: value }))}>{value === 'accept' ? '허용' : value === 'drop' ? '차단' : '거부'}</Segment>)}</Segmented></FieldGroup>
          <FieldGroup>방향<Segmented role="group" aria-label="규칙 방향">{(['in', 'out'] as const).map(value => <Segment key={value} type="button" $active={ruleForm.direction === value} aria-pressed={ruleForm.direction === value} onClick={() => setRuleForm(current => ({ ...current, direction: value }))}>{value === 'in' ? '수신' : '송신'}</Segment>)}</Segmented></FieldGroup>
          <FieldGroup>프로토콜<Select value={ruleForm.protocol} onChange={event => setRuleForm(current => ({ ...current, protocol: event.target.value as FirewallProtocol }))}><option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option></Select></FieldGroup>
          {ruleForm.protocol !== 'icmp' && <FieldGroup>목적지 포트<Input value={ruleForm.dport} onChange={event => setRuleForm(current => ({ ...current, dport: event.target.value }))} placeholder="예: 80 또는 8000:8100" /></FieldGroup>}
          <FieldGroup>출발지 (선택)<Input value={ruleForm.source} onChange={event => setRuleForm(current => ({ ...current, source: event.target.value }))} placeholder="IP 또는 CIDR" /></FieldGroup>
          <Muted>규칙을 추가하면 방화벽이 자동으로 켜집니다.</Muted>
          {error && <InlineError role="alert">{error}</InlineError>}
          <DialogActions><Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={finishAction}>취소</Button><Button type="submit" variant="primary" icon={<Octicon name="plus" size={16} />} disabled={submitting}>{submitting ? '추가 중…' : '규칙 추가'}</Button></DialogActions>
        </Form>
      </DialogFrame>}

      {action === 'firewall-confirm' && <DialogFrame title="방화벽을 켜고 규칙을 추가할까요?" onClose={finishAction}>
        <DialogCopy>규칙을 추가하면 방화벽이 자동으로 켜집니다. 수신 연결은 허용한 규칙에 따라 제한됩니다.</DialogCopy>
        {error && <InlineError role="alert">{error}</InlineError>}
        <DialogActions>
          <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={() => setAction('rule')}>취소</Button>
          <Button variant="primary" icon={<Octicon name="shield" size={16} />} onClick={() => void confirmFirewallRule()}>방화벽 켜고 규칙 추가</Button>
        </DialogActions>
      </DialogFrame>}

      {action === 'firewall-loading' && <DialogFrame title="방화벽을 켜는 중이에요" onClose={() => { if (!submitting) finishAction(); }}>
        <DialogCopy>규칙을 저장하고 방화벽 상태를 확인하고 있습니다.</DialogCopy>
        <LoadingCard height={72} />
      </DialogFrame>}

      {action === 'firewall-error' && <DialogFrame title="방화벽을 켜지 못했어요" onClose={finishAction}>
        <DialogCopy>요청 결과를 확인할 수 없습니다. 규칙 목록을 새로 불러온 뒤 방화벽 상태를 확인해 주세요.</DialogCopy>
        {error && <InlineError role="alert">{error}</InlineError>}
        <DialogActions>
          <Button variant="secondary" onClick={finishAction}>닫기</Button>
          <Button variant="primary" icon={<Octicon name="sync" size={16} />} onClick={() => { finishAction(); reload(); }}>목록 새로고침</Button>
        </DialogActions>
      </DialogFrame>}

      {action === 'domain' && <DialogFrame title="HTTPS Domain 추가" onClose={finishAction}>
        <Form onSubmit={event => void submitDomain(event)}>
          <FieldGroup>서브도메인<Input required maxLength={63} pattern="[a-z0-9-]+" value={domainForm.subdomain} onChange={event => setDomainForm(current => ({ ...current, subdomain: event.target.value }))} placeholder="예: portfolio-api" /></FieldGroup>
          <FieldGroup>내부 포트<Input type="number" required min="1" max="65535" value={domainForm.internalPort} onChange={event => setDomainForm(current => ({ ...current, internalPort: event.target.value }))} placeholder="예: 8080" /></FieldGroup>
          <Muted>서브도메인은 전체 서비스에서 유일해야 하며, 예약어는 사용할 수 없습니다.</Muted>
          {error && <InlineError role="alert">{error}</InlineError>}
          <DialogActions><Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={finishAction}>취소</Button><Button type="submit" variant="primary" icon={<Octicon name="plus" size={16} />} disabled={submitting}>{submitting ? '연결 중…' : 'Domain 추가'}</Button></DialogActions>
        </Form>
      </DialogFrame>}

      {action === 'restore' && <DialogFrame title="기본 포트를 복원할까요?" onClose={finishAction}>
        <DialogCopy>SSH, HTTP, SVC 기본 포트 중 빠진 항목만 다시 추가합니다.</DialogCopy>
        {error && <InlineError role="alert">{error}</InlineError>}
        <DialogActions><Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={finishAction}>취소</Button><Button variant="primary" icon={<Octicon name="history" size={16} />} disabled={submitting} onClick={() => void restoreDefaults()}>{submitting ? '복원 중…' : '기본 포트 복원'}</Button></DialogActions>
      </DialogFrame>}

      {confirmTarget && <DialogFrame title={confirmTarget.kind === 'port' && confirmTarget.value.kind === 'ssh' ? 'SSH 기본 포트를 삭제할까요?' : '삭제할까요?'} onClose={() => setConfirmTarget(null)}>
        <DialogCopy>
          {confirmTarget.kind === 'port' ? confirmTarget.value.kind === 'ssh' ? 'SSH 기본 포트를 삭제하면 이 포트포워딩을 통한 외부 SSH 접속이 중단됩니다.' : `${portLabel(confirmTarget.value)} 포트포워딩을 삭제합니다.` : confirmTarget.kind === 'rule' ? '이 방화벽 규칙을 삭제합니다. 방화벽은 켜진 상태로 유지됩니다.' : `${confirmTarget.value.url} Domain 연결을 삭제합니다.`}
        </DialogCopy>
        {error && <InlineError role="alert">{error}</InlineError>}
        <DialogActions><Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={() => setConfirmTarget(null)}>취소</Button><Button variant="danger" icon={<Octicon name="trashcan" size={16} />} disabled={submitting} onClick={() => void confirmDelete()}>{submitting ? '삭제 중…' : '삭제'}</Button></DialogActions>
      </DialogFrame>}
    </StudentShell>
  );
}
