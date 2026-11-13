import { useMemo, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button, SegmentedControl, TextField } from '../../shared/ui/controls';
import { Octicon } from '../../shared/ui/icons';

export type ServerlessRuntime = 'javascript' | 'typescript' | 'python';

export interface ServerlessFunctionDraft {
  name: string;
  runtime: ServerlessRuntime;
  timeoutSeconds: 30 | 60;
  memoryMb: 128 | 256;
  description: string;
  code: string;
}

export interface ServerlessCreatePageProps {
  onCancel: () => void;
  onCreate: (draft: ServerlessFunctionDraft) => void;
}

const starterCode: Record<ServerlessRuntime, string> = {
  javascript: `export default async function handler(request, env) {
  let name = "GSM";
  if (request?.method === "POST") {
    const body = await request.json().catch(() => ({}));
    name = body.name || name;
  }
  const greeting = env.GREETING || "안녕하세요";
  console.log("Greeting sent", name);
  return Response.json({ message: \`${'${greeting}'}, ${'${name}'}!\` });
}`,
  typescript: `export default async function handler(request: Request, env: Env) {
  let name = "GSM";
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({})) as { name?: string };
    name = body.name || name;
  }
  const greeting = env.GREETING || "안녕하세요";
  console.log("Greeting sent", name);
  return Response.json({ message: \`${'${greeting}'}, ${'${name}'}!\` });
}`,
  python: `async def handler(request, env):
    name = "GSM"
    if request.method == "POST":
        body = await request.json()
        name = body.get("name", name)
    greeting = env.get("GREETING", "안녕하세요")
    print("Greeting sent", name)
    return {"message": f"{greeting}, {name}!"}`,
};

const Page = styled.div`
  box-sizing: border-box;
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
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const Heading = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`;

const TitleGroup = styled.div`
  display: flex;
  min-width: 0;
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

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

const Notice = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.surface};
`;

const NoticeIcon = styled.span`
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const NoticeCopy = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
`;

const NoticeTitle = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font: 500 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
`;

const NoticeDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font: 400 12px/18px ${({ theme }) => theme.typography.body.family}, sans-serif;
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

const FieldGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  color: ${({ theme }) => theme.colors.muted};
  font: ${({ theme }) => theme.typography.label.weight} ${({ theme }) => theme.typography.label.size}px/${({ theme }) => theme.typography.label.lineHeight}px ${({ theme }) => theme.typography.label.family}, sans-serif;
`;

const Control = styled.div`
  width: 100%;
  height: 42px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.field};

  & > div {
    height: 100%;
    padding: 4px;
    background: transparent;
  }

  [role='radiogroup'] {
    height: 100%;
  }

  [role='radio'] {
    border-radius: ${({ theme }) => theme.radii.base}px;
    color: ${({ theme }) => theme.colors.muted};
    font: ${({ theme }) => theme.typography.button.weight} ${({ theme }) => theme.typography.button.size}px/${({ theme }) => theme.typography.button.lineHeight}px ${({ theme }) => theme.typography.button.family}, sans-serif;
  }

  [role='radio'][aria-checked='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.base}px;
  outline: none;
  background: ${({ theme }) => theme.colors.field};
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.bodySmall.weight} ${({ theme }) => theme.typography.bodySmall.size}px/${({ theme }) => theme.typography.bodySmall.lineHeight}px ${({ theme }) => theme.typography.bodySmall.family}, sans-serif;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: -2px; }
`;

const Help = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.faint};
  font: ${({ theme }) => theme.typography.caption.weight} ${({ theme }) => theme.typography.caption.size}px/${({ theme }) => theme.typography.caption.lineHeight}px ${({ theme }) => theme.typography.caption.family}, sans-serif;
`;

const EditorCard = styled(Card)`
  gap: 16px;
`;

const EditorHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.primary};
`;

const EditorTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font: ${({ theme }) => theme.typography.title.weight} ${({ theme }) => theme.typography.title.size}px/${({ theme }) => theme.typography.title.lineHeight}px ${({ theme }) => theme.typography.title.family}, sans-serif;
`;

const CodeEditor = styled.div`
  display: grid;
  min-height: 180px;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border-radius: ${({ theme }) => theme.radii.base}px;
  background: ${({ theme }) => theme.colors.sidebar};
  font: ${({ theme }) => theme.typography.code.weight} ${({ theme }) => theme.typography.code.size}px/${({ theme }) => theme.typography.code.lineHeight}px ${({ theme }) => theme.typography.code.family}, monospace;
`;

const LineNumbers = styled.div`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.faint};
  text-align: left;
  user-select: none;
  white-space: pre;
`;

const CodeInput = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  min-height: 180px;
  resize: vertical;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  tab-size: 2;
  white-space: pre;

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 4px; }
`;

export default function ServerlessCreatePage({ onCancel, onCreate }: ServerlessCreatePageProps) {
  const [name, setName] = useState('welcome-api');
  const [runtime, setRuntime] = useState<ServerlessRuntime>('javascript');
  const [timeoutSeconds, setTimeoutSeconds] = useState<'30' | '60'>('30');
  const [memoryMb, setMemoryMb] = useState<'128' | '256'>('128');
  const [description, setDescription] = useState('서비스 첫 방문자에게 환영 메시지를 반환합니다.');
  const [code, setCode] = useState(starterCode.javascript);
  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleRuntimeChange = (value: string) => {
    const selectedRuntime = value as ServerlessRuntime;
    setRuntime(selectedRuntime);
    setCode(starterCode[selectedRuntime]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({
      name: name.trim(),
      runtime,
      timeoutSeconds: Number(timeoutSeconds) as 30 | 60,
      memoryMb: Number(memoryMb) as 128 | 256,
      description: description.trim(),
      code,
    });
  };

  return (
    <Page data-node-id="52:3315">
      <Breadcrumb>Serverless</Breadcrumb>
      <form onSubmit={handleSubmit}>
        <FormContent>
          <Heading>
            <TitleGroup>
              <Title>새 함수 만들기</Title>
              <Subtitle>코드를 작성하면 다음 단계에서 실행 방법을 연결할 수 있습니다.</Subtitle>
            </TitleGroup>
            <Actions>
              <Button variant="secondary" icon={<Octicon name="x" size={16} />} onClick={onCancel}>취소</Button>
              <Button variant="primary" icon={<Octicon name="plus" size={16} />} type="submit">함수 생성</Button>
            </Actions>
          </Heading>

          <Notice role="note">
            <NoticeIcon aria-hidden="true"><Octicon name="info" size={20} /></NoticeIcon>
            <NoticeCopy>
              <NoticeTitle>실행 환경을 먼저 확인하세요</NoticeTitle>
              <NoticeDescription>함수는 격리된 샌드박스 컨테이너에서 실행됩니다. 실행 사이에 메모리 값이나 임시 파일이 남는다고 기대하지 마세요. 패키지는 GSMSV가 미리 넣어 둔 것만 쓸 수 있습니다.</NoticeDescription>
            </NoticeCopy>
          </Notice>

          <Card>
            <CardTitle>함수 정보</CardTitle>
            <FieldGroup>
              <TextField
                id="serverless-name"
                label="함수 이름"
                hint="함수를 알아볼 이름을 입력하세요. 호출 주소에는 이름이 들어가지 않습니다."
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Runtime</FieldLabel>
              <Control>
                <SegmentedControl
                  label="Runtime"
                  options={[
                    { value: 'javascript', label: 'JavaScript' },
                    { value: 'typescript', label: 'TypeScript' },
                    { value: 'python', label: 'Python' },
                  ]}
                  value={runtime}
                  onChange={handleRuntimeChange}
                />
              </Control>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>실행 시간</FieldLabel>
              <Control>
                <SegmentedControl
                  label="실행 시간"
                  options={[{ value: '30', label: '30초' }, { value: '60', label: '60초' }]}
                  value={timeoutSeconds}
                  onChange={(value) => setTimeoutSeconds(value as '30' | '60')}
                />
              </Control>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>메모리</FieldLabel>
              <Control>
                <SegmentedControl
                  label="메모리"
                  options={[{ value: '128', label: '128MB' }, { value: '256', label: '256MB' }]}
                  value={memoryMb}
                  onChange={(value) => setMemoryMb(value as '128' | '256')}
                />
              </Control>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="serverless-description">설명</FieldLabel>
              <TextInput id="serverless-description" value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
            </FieldGroup>
          </Card>

          <EditorCard>
            <EditorHeading>
              <Octicon name="code" size={16} aria-hidden="true" />
              <EditorTitle>시작 코드</EditorTitle>
            </EditorHeading>
            <CodeEditor>
              <LineNumbers aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}</LineNumbers>
              <CodeInput aria-label="시작 코드" spellCheck={false} value={code} onChange={(event) => setCode(event.currentTarget.value)} />
            </CodeEditor>
            <Help>console 출력은 실행 Log에서 확인할 수 있습니다.</Help>
          </EditorCard>
        </FormContent>
      </form>
    </Page>
  );
}

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
