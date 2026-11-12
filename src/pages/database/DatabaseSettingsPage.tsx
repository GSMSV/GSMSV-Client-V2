import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { deleteDatabase, getDatabase, renameDatabase, rotateDatabasePassword } from '../../entities/database';
import type { DatabaseDetail, DatabaseOperation, DatabasePasswordRotation } from '../../entities/database';
import { getSessionUser } from '../../entities/session';
import { listMyTeams, type TeamRole, type TeamSummary } from '../../entities/team';
import { Button, TextField } from '../../shared/ui/controls';
import { Banner, DeleteConfirmDialog, ErrorCard, LoadingCard, RevealableSecret } from '../../shared/ui/feedback';
import { Octicon } from '../../shared/ui/icons';
import { StudentShell, type StudentNavigationKey } from '../../widgets/student-shell';

const Page = styled.div`display:flex;width:100%;max-width:1224px;flex-direction:column;gap:24px;padding:40px;`;
const Breadcrumb = styled.button`
  width:fit-content;padding:0;border:0;background:transparent;color:${({ theme }) => theme.colors.faint};
  font:${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family},sans-serif;
  cursor:pointer;&:hover{color:${({ theme }) => theme.colors.text};}&:focus-visible{outline:2px solid ${({ theme }) => theme.colors.primary};outline-offset:3px;}
`;
const HeadingGroup = styled.section`display:flex;flex-direction:column;gap:8px;width:100%;`;
const Title = styled.h1`
  margin:0;color:${({ theme }) => theme.colors.text};
  font:${({ theme }) => theme.typography.h1.weight} ${({ theme }) => theme.typography.h1.size}px/${({ theme }) => theme.typography.h1.lineHeight}px ${({ theme }) => theme.typography.h1.family},sans-serif;
`;
const Subtitle = styled.p`
  margin:0;color:${({ theme }) => theme.colors.muted};
  font:${({ theme }) => theme.typography.body.weight} ${({ theme }) => theme.typography.body.size}px/${({ theme }) => theme.typography.body.lineHeight}px ${({ theme }) => theme.typography.body.family},sans-serif;
`;
const TabsRow = styled.div`display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;`;
const Tabs = styled.nav`display:flex;align-items:center;gap:8px;min-width:0;`;
const Tab = styled.button<{ $active?: boolean }>`
  display:inline-flex;min-height:42px;align-items:center;padding:0 12px;border:0;border-radius:${({ theme }) => theme.radii.base}px;
  background:${({ theme,$active }) => $active ? theme.colors.primarySoft:'transparent'};color:${({ theme,$active }) => $active ? theme.colors.primary:theme.colors.muted};
  font:${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family},sans-serif;
  cursor:pointer;&:hover:not(:disabled){background:${({ theme,$active }) => $active ? theme.colors.primarySoft:theme.colors.overlayHover};color:${({ theme }) => theme.colors.text};}
  &:disabled{opacity:1;cursor:not-allowed;}&:focus-visible{outline:2px solid ${({ theme }) => theme.colors.primary};outline-offset:2px;}
`;
const Card = styled.section`display:flex;width:100%;flex-direction:column;gap:16px;padding:24px;border-radius:${({ theme }) => theme.radii.base}px;background:${({ theme }) => theme.colors.surface};`;
const CardHeader = styled.div`display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;`;
const CardTitle = styled.h2`
  margin:0;color:${({ theme }) => theme.colors.text};
  font:${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family},sans-serif;
`;
const Field = styled.div`display:flex;flex-direction:column;gap:8px;width:100%;`;
const FieldHint = styled.p`
  margin:0;color:${({ theme }) => theme.colors.faint};
  font:${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family},sans-serif;
`;
const InfoRow = styled.div`display:flex;align-items:flex-start;gap:16px;width:100%;`;
const InfoIcon = styled.span<{ $tone?: 'danger' | 'muted' }>`
  display:inline-flex;flex:0 0 16px;align-items:center;justify-content:center;width:16px;height:22px;
  color:${({ theme,$tone }) => $tone === 'danger' ? theme.colors.danger:theme.colors.muted};
`;
const InfoText = styled.div`display:flex;min-width:0;flex:1;flex-direction:column;gap:4px;`;
const InfoTitle = styled.span`
  color:${({ theme }) => theme.colors.text};
  font:${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family},sans-serif;
`;
const InfoDescription = styled.span`
  color:${({ theme }) => theme.colors.faint};
  font:${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family},sans-serif;
`;
const Overlay = styled.div`
  position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.45);
`;
const Dialog = styled.section`
  display:flex;box-sizing:border-box;width:min(480px,100%);flex-direction:column;gap:16px;padding:24px;
  border:1px solid ${({ theme }) => theme.colors.border};border-radius:${({ theme }) => theme.radii.base}px;
  background:${({ theme }) => theme.colors.surface};box-shadow:0 12px 16px rgba(0,0,0,.45);
`;
const DialogHeader = styled.header`display:flex;align-items:center;gap:12px;`;
const DialogIcon = styled.span<{ $tone:'warning'|'danger'|'success' }>`
  display:inline-flex;flex:0 0 24px;align-items:center;justify-content:center;width:24px;height:24px;
  color:${({ theme,$tone }) => $tone === 'danger' ? theme.colors.danger:$tone === 'success' ? theme.colors.primary:theme.colors.warning};
`;
const DialogTitle = styled.h2`
  margin:0;flex:1;color:${({ theme }) => theme.colors.text};
  font:${({ theme }) => theme.typography.h2.weight} ${({ theme }) => theme.typography.h2.size}px/${({ theme }) => theme.typography.h2.lineHeight}px ${({ theme }) => theme.typography.h2.family},sans-serif;
`;
const DialogCopy = styled.div`
  display:flex;flex-direction:column;gap:8px;color:${({ theme }) => theme.colors.muted};
  font:${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family},sans-serif;
`;
const DialogActions = styled.div`display:flex;justify-content:flex-end;gap:8px;width:100%;`;
const FormError = styled.p`
  margin:0;color:${({ theme }) => theme.colors.danger};
  font:${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family},sans-serif;
`;
const ResultLine = styled.p`
  margin:0;color:${({ theme }) => theme.colors.muted};
  font:${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family},sans-serif;
`;

interface Loadable<T>{value:T|null;loading:boolean;error:boolean;}
const initial = <T,>():Loadable<T>=>({value:null,loading:true,error:false});
function engineIsolation(database:DatabaseDetail){return `${database.engine==='mysql'?'MySQL':'PostgreSQL'} · ${database.isolation==='shared'?'공유형':'전용형'}`;}

export default function DatabaseSettingsPage(){
  const {databaseGrn=''}=useParams();
  const navigate=useNavigate();
  const user=getSessionUser();
  const [detail,setDetail]=useState<Loadable<DatabaseDetail>>(initial);
  const [teams,setTeams]=useState<TeamSummary[]>([]);
  const [name,setName]=useState('');
  const [retryKey,setRetryKey]=useState(0);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState(false);
  const [saved,setSaved]=useState(false);
  const [showRotationDialog,setShowRotationDialog]=useState(false);
  const [rotating,setRotating]=useState(false);
  const [rotationError,setRotationError]=useState(false);
  const [rotationResult,setRotationResult]=useState<DatabasePasswordRotation|null>(null);
  const [showDeleteDialog,setShowDeleteDialog]=useState(false);
  const [confirmName,setConfirmName]=useState('');
  const [deleting,setDeleting]=useState(false);
  const [deleteError,setDeleteError]=useState(false);
  const [deleteOperation,setDeleteOperation]=useState<DatabaseOperation|null>(null);
  const deleteIdempotencyKey=useRef<string|null>(null);

  const load=useCallback(async(signal:AbortSignal)=>{
    setDetail(current=>({...current,loading:true,error:false}));
    try{
      const value=await getDatabase(databaseGrn,signal);
      if(!signal.aborted){setDetail({value,loading:false,error:false});setName(value.name);}
    }catch{
      if(!signal.aborted)setDetail({value:null,loading:false,error:true});
    }
  },[databaseGrn]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[load,retryKey]);
  useEffect(()=>{const controller=new AbortController();void listMyTeams(controller.signal).then(value=>{if(!controller.signal.aborted)setTeams(value);}).catch(()=>{if(!controller.signal.aborted)setTeams([]);});return()=>controller.abort();},[]);
  useEffect(()=>{
    if(!showRotationDialog&&!rotationResult&&!showDeleteDialog)return;
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!rotating&&!deleting){setShowRotationDialog(false);setRotationResult(null);setShowDeleteDialog(false);}};
    window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown);
  },[showRotationDialog,rotationResult,showDeleteDialog,rotating,deleting]);

  const databaseListPath=(database:DatabaseDetail)=>database.owner.type==='team'?`/databases?owner=${encodeURIComponent(database.owner.id)}`:'/databases';
  const teamPath=(database:DatabaseDetail,suffix='')=>`/teams/${encodeURIComponent(database.owner.id)}${suffix}`;
  const scopeOptions=useMemo(()=>{
    const owner=detail.value?.owner;
    const roleLabels:Record<TeamRole,string>={leader:'팀장',devops:'DevOps',member:'팀원'};
    const options=[
      {id:'personal',label:'내 Resources',selected:owner?.type!=='team',onSelect:()=>navigate('/databases')},
      ...teams.map(team=>({id:team.id,label:`${team.name} · ${roleLabels[team.my_role]}`,selected:owner?.type==='team'&&team.id===owner.id,onSelect:()=>navigate(`/databases?owner=${encodeURIComponent(team.id)}`)})),
    ];
    if(owner?.type==='team'&&!options.some(option=>option.id===owner.id))options.push({id:owner.id,label:`${owner.name} · 팀`,selected:true,onSelect:()=>navigate(`/databases?owner=${encodeURIComponent(owner.id)}`)});
    return options;
  },[detail.value?.owner,navigate,teams]);
  const navigateFromShell=(item:Exclude<StudentNavigationKey,'none'>)=>{
    const current=detail.value;
    if(item==='database')navigate(current?databaseListPath(current):'/databases');
    if(item==='apps')navigate(current?.owner.type==='team'?teamPath(current,'/apps'):'/apps');
    if(item==='home')navigate(current?.owner.type==='team'?teamPath(current):'/');
    if(item==='team')navigate(current?.owner.type==='team'?teamPath(current):'/teams');
  };
  const value=detail.value;
  const trimmedName=name.trim();
  const nameValid=trimmedName.length>=1&&trimmedName.length<=30;
  const nameDirty=Boolean(value&&trimmedName!==value.name);

  const saveName=async()=>{
    if(!value||!value.permissions.update||!nameValid||!nameDirty||saving)return;
    setSaving(true);setSaveError(false);setSaved(false);
    try{
      const result=await renameDatabase(value.grn,trimmedName);
      setDetail(current=>current.value?{...current,value:{...current.value,name:result.name}}:current);
      setName(result.name);setSaved(true);
    }catch{setSaveError(true);}
    finally{setSaving(false);}
  };

  const rotatePassword=async()=>{
    if(!value||!value.permissions.rotate_password||rotating)return;
    setRotating(true);setRotationError(false);
    try{const result=await rotateDatabasePassword(value.grn);setRotationResult(result);setShowRotationDialog(false);}
    catch{setRotationError(true);}
    finally{setRotating(false);}
  };

  const deleteResource=async()=>{
    if(!value||!value.permissions.delete||confirmName!==value.name||deleting)return;
    setDeleting(true);setDeleteError(false);
    try{const result=await deleteDatabase(value.grn,confirmName,{idempotencyKey:deleteIdempotencyKey.current??crypto.randomUUID()});setDeleteOperation(result);setShowDeleteDialog(false);setConfirmName('');deleteIdempotencyKey.current=null;}
    catch{setDeleteError(true);}
    finally{setDeleting(false);}
  };

  return <StudentShell activeItem="database" scopeLabel={value?.owner.type==='team'?`${value.owner.name} · 팀`:'내 Resources'} scopeOptions={scopeOptions} userName={user?.name??'사용자'} onNavigate={navigateFromShell} onCreateTeam={()=>navigate('/teams/new')} onOpenStatus={()=>navigate('/status')} onSelectScope={()=>undefined} onSearch={()=>undefined} onOpenNotifications={()=>undefined} onOpenProfile={()=>undefined}>
    <Page>
      <Breadcrumb type="button" onClick={()=>navigate(value?databaseListPath(value):'/databases')}>Database</Breadcrumb>
      {detail.loading&&!value?<LoadingCard width="100%" height={174}/>:detail.error||!value?<ErrorCard onRetry={()=>setRetryKey(key=>key+1)}/>:<>
        <HeadingGroup><Title>{value.name}</Title><Subtitle>{engineIsolation(value)}</Subtitle></HeadingGroup>
        <TabsRow>
          <Tabs aria-label="Database 상세 메뉴">
            <Tab type="button" onClick={()=>navigate(`/databases/${encodeURIComponent(value.grn)}`)}>접속 정보</Tab>
            <Tab type="button" title="쿼리 실행 API가 계약에 없어 제공되지 않습니다" disabled>쿼리 콘솔</Tab>
            <Tab type="button" onClick={()=>navigate(`/databases/${encodeURIComponent(value.grn)}/backups`)}>백업</Tab>
            <Tab type="button" $active aria-current="page">설정</Tab>
          </Tabs>
          {value.permissions.update&&<Button variant="primary" icon={<Octicon name="check" size={16}/>} disabled={!nameValid||!nameDirty||saving||Boolean(deleteOperation)} onClick={()=>void saveName()}>{saving?'저장 중':'설정 저장'}</Button>}
        </TabsRow>
        {saved&&<Banner title="Database 이름을 저장했습니다" tone="primary" icon={<Octicon name="check-circle" size={20}/>}/>}
        {saveError&&<Banner title="Database 이름을 저장하지 못했습니다" description="입력한 내용을 확인하고 다시 시도해 주세요." tone="danger" icon={<Octicon name="alert" size={20}/>}/>}
        <Card>
          <CardTitle>기본 정보</CardTitle>
          <Field>
            <TextField label="이름" value={name} maxLength={30} required disabled={!value.permissions.update||Boolean(deleteOperation)} onChange={event=>{setName(event.currentTarget.value);setSaved(false);setSaveError(false);}}/>
            <FieldHint>이름은 화면에만 표시됩니다. 서버의 database·계정 이름 {value.connection.database}은 바뀌지 않습니다.</FieldHint>
          </Field>
          <Field>
            <TextField label="엔진 · 격리 방식" value={engineIsolation(value)} disabled readOnly/>
          </Field>
        </Card>
        <Card>
          <CardHeader><CardTitle>비밀번호 교체</CardTitle>{value.permissions.rotate_password&&<Button variant="secondary" icon={<Octicon name="sync" size={16}/>} disabled={Boolean(deleteOperation)} onClick={()=>{setRotationError(false);setShowRotationDialog(true);}}>비밀번호 교체</Button>}</CardHeader>
          <InfoRow><InfoIcon><Octicon name="link" size={16}/></InfoIcon><InfoText><InfoTitle>연결된 앱과 함수의 접속 정보는 자동으로 갱신됩니다</InfoTitle><InfoDescription>실제 연결 대상 목록은 Database 상세 API에서 제공되지 않습니다. 교체하면 기존 DB 접속이 끊기며 새 비밀번호를 접속 정보 탭에서 확인할 수 있습니다.</InfoDescription></InfoText></InfoRow>
          {rotationError&&<FormError role="alert">비밀번호를 교체하지 못했습니다. 다시 시도해 주세요.</FormError>}
        </Card>
        <Card>
          <CardHeader><CardTitle>Database 삭제</CardTitle>{value.permissions.delete&&<Button variant="danger" icon={<Octicon name="trashcan" size={16}/>} disabled={Boolean(deleteOperation)} onClick={()=>{setDeleteError(false);setConfirmName('');deleteIdempotencyKey.current=crypto.randomUUID();setShowDeleteDialog(true);}}>Database 삭제</Button>}</CardHeader>
          <InfoRow><InfoIcon $tone="danger"><Octicon name="alert" size={16}/></InfoIcon><InfoText><InfoTitle>Database와 접속 계정이 삭제됩니다</InfoTitle><InfoDescription>백업 파일은 7일 동안 보관되며 관리자만 복구할 수 있습니다. 이 동작은 비동기로 처리됩니다.</InfoDescription></InfoText></InfoRow>
        </Card>
        {deleteOperation&&<Banner title="삭제 작업을 시작했습니다" description={`작업 상태: ${deleteOperation.operation.status} · 작업 ID: ${deleteOperation.operation.id}. 삭제 완료를 의미하지 않습니다.`} tone="warning" icon={<Octicon name="clock" size={20}/>}/>}
        {deleteError&&<Banner title="Database 삭제를 시작하지 못했습니다" description="이름을 정확히 입력했는지 확인하고 다시 시도해 주세요." tone="danger" icon={<Octicon name="alert" size={20}/>}/>}
      </>}
    </Page>
    {showRotationDialog&&value&&<Overlay onMouseDown={event=>{if(event.target===event.currentTarget&&!rotating)setShowRotationDialog(false);}}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="rotate-dialog-title">
        <DialogHeader><DialogIcon $tone="warning"><Octicon name="sync" size={24}/></DialogIcon><DialogTitle id="rotate-dialog-title">비밀번호를 교체하시겠습니까?</DialogTitle></DialogHeader>
        <DialogCopy><span>지금 이 비밀번호로 붙어 있는 앱과 접속이 바로 끊깁니다.</span><span>· 연결된 앱과 함수의 접속 정보는 자동으로 갱신됩니다.</span><span>· 새 비밀번호는 접속 정보 탭에서 다시 볼 수 있습니다.</span>{rotationError&&<FormError role="alert">교체에 실패했습니다. 다시 시도해 주세요.</FormError>}</DialogCopy>
        <DialogActions><Button variant="secondary" icon={<Octicon name="x" size={16}/>} disabled={rotating} onClick={()=>setShowRotationDialog(false)}>취소</Button><Button variant="danger" icon={<Octicon name="sync" size={16}/>} disabled={rotating} onClick={()=>void rotatePassword()}>{rotating?'교체 중':'교체'}</Button></DialogActions>
      </Dialog>
    </Overlay>}
    {rotationResult&&<Overlay onMouseDown={event=>{if(event.target===event.currentTarget)setRotationResult(null);}}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="rotation-result-title">
        <DialogHeader><DialogIcon $tone="success"><Octicon name="check-circle" size={24}/></DialogIcon><DialogTitle id="rotation-result-title">새 비밀번호를 만들었습니다</DialogTitle></DialogHeader>
        <DialogCopy><span>이전 비밀번호로 연결되어 있던 기존 접속은 끊겼습니다.</span><ResultLine>연결 갱신: 함수 {rotationResult.reconnected.functions}개 · 앱 {rotationResult.reconnected.app_cells}개</ResultLine><ResultLine>교체 시각: {new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(rotationResult.rotated_at))}</ResultLine></DialogCopy>
        <RevealableSecret label="새 비밀번호" value={rotationResult.password} initiallyShown/>
        <DialogActions><Button variant="secondary" onClick={()=>setRotationResult(null)}>닫기</Button></DialogActions>
      </Dialog>
    </Overlay>}
    {showDeleteDialog&&value&&<Overlay onMouseDown={event=>{if(event.target===event.currentTarget&&!deleting){setShowDeleteDialog(false);setConfirmName('');}}}>
      <DeleteConfirmDialog
        open
        title={`${value.name}을(를) 삭제하시겠습니까?`}
        description="Database와 접속 계정을 지웁니다. 백업 파일은 7일 동안 보관되며 관리자만 복구할 수 있습니다."
        items={<div>· Database 크기 {new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2}).format(value.storage.used_gb)} GB<br/>· 접속 계정 {value.connection.database}{deleteError&&<FormError role="alert">삭제 요청에 실패했습니다. 다시 시도해 주세요.</FormError>}</div>}
        fieldLabel="확인하려면 Database 이름을 입력하세요"
        confirmationName={value.name}
        value={confirmName}
        onValueChange={text=>{setConfirmName(text);setDeleteError(false);}}
        onConfirm={()=>void deleteResource()}
        onCancel={()=>{if(!deleting){setShowDeleteDialog(false);setConfirmName('');deleteIdempotencyKey.current=null;}}}
        caption="삭제 요청은 비동기로 처리되며 즉시 완료되지 않을 수 있습니다."
        cancelLabel="취소"
        confirmLabel={deleting?'삭제 요청 중':'Database 삭제'}
        confirmIcon={<Octicon name="trashcan" size={16}/>}
        confirmDisabled={deleting}
      />
    </Overlay>}
  </StudentShell>;
}
