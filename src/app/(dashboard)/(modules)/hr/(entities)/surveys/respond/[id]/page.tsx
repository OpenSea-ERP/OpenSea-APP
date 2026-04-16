/**
 * OpenSea OS - Survey Respond Page
 *
 * Página dedicada para responder a uma pesquisa, inspirada em 15Five Pulse
 * (uma pergunta por vez) e Typeform (progresso visível, transições suaves).
 *
 * - Stepper interno: 1 pergunta por step quando há mais de 3 perguntas
 *   (progressivo). Quando ≤ 3 perguntas, renderiza tudo em uma única tela.
 * - Render apropriado por tipo via SurveyAnswerInput.
 * - Progress bar fixa no topo.
 * - Submit final → toast de agradecimento + redirect para /hr/surveys.
 */

'use client';

import { SurveyAnswerInput } from '@/components/hr/survey-answer-input';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { surveysService } from '@/services/hr/surveys.service';
import type {
  SurveyAnswer,
  SurveyQuestion,
  SurveyType,
} from '@/types/hr';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  Send,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  QUESTION_CATEGORY_LABELS,
  SURVEY_TYPE_COLORS,
  SURVEY_TYPE_LABELS,
} from '../../src';
import type { SurveyQuestionCategory } from '@/types/hr';

const STEPPER_THRESHOLD = 3;

export default function SurveyRespondPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const surveyId = params.id as string;

  const canAccess = hasPermission(HR_PERMISSIONS.SURVEYS.ACCESS);

  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});

  const {
    data: survey,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['surveys', surveyId, 'respond'],
    queryFn: async () => {
      const result = await surveysService.get(surveyId);
      return result.survey;
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answersArray = Object.values(answers);
      return surveysService.submitResponse(surveyId, {
        answers: answersArray,
      });
    },
    onSuccess: () => {
      toast.success('Obrigado por participar!', {
        description:
          'Sua resposta foi registrada e ajuda a melhorar o ambiente de trabalho.',
      });
      router.push('/hr/surveys?tab=pending');
    },
    onError: () => {
      toast.error('Não foi possível enviar a resposta. Tente novamente.');
    },
  });

  const updateAnswer = (
    questionId: string,
    partial: Partial<SurveyAnswer>
  ) => {
    setAnswers(previous => {
      const existing = previous[questionId] ?? {
        questionId,
        ratingValue: null,
        textValue: null,
        selectedOptions: null,
      };
      return {
        ...previous,
        [questionId]: { ...existing, ...partial },
      };
    });
  };

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================

  if (!canAccess) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Pesquisas', href: '/hr/surveys' },
              { label: 'Sem permissão' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Sem permissão"
            message="Você não tem permissão para responder pesquisas."
          />
        </PageBody>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout data-testid="survey-respond-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Pesquisas', href: '/hr/surveys' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !survey) {
    return (
      <PageLayout data-testid="survey-respond-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Pesquisas', href: '/hr/surveys' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Pesquisa não encontrada"
            message="A pesquisa solicitada não existe ou não está disponível."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/surveys'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER PREP
  // ============================================================================

  const questions: SurveyQuestion[] = (survey.questions ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);

  const typeColors =
    SURVEY_TYPE_COLORS[survey.type as SurveyType] ?? SURVEY_TYPE_COLORS.CUSTOM;

  const isProgressive = questions.length > STEPPER_THRESHOLD;
  const totalSteps = isProgressive ? questions.length : 1;
  const currentStep = isProgressive ? activeIndex + 1 : 1;
  const progressPct =
    totalSteps === 0 ? 0 : Math.round((currentStep / totalSteps) * 100);

  const isQuestionAnswered = (question: SurveyQuestion): boolean => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (
      question.type === 'RATING_1_5' ||
      question.type === 'RATING_1_10' ||
      question.type === 'YES_NO' ||
      question.type === 'NPS'
    ) {
      return answer.ratingValue !== null && answer.ratingValue !== undefined;
    }
    if (question.type === 'TEXT') {
      return !!answer.textValue && answer.textValue.trim().length > 0;
    }
    if (question.type === 'MULTIPLE_CHOICE') {
      return (
        Array.isArray(answer.selectedOptions) &&
        answer.selectedOptions.length > 0
      );
    }
    return false;
  };

  const allRequiredAnswered = useMemoRequiredAnswered(questions, answers);

  const currentQuestion = questions[activeIndex];
  const canAdvanceCurrent =
    !isProgressive || !currentQuestion || !currentQuestion.isRequired
      ? true
      : isQuestionAnswered(currentQuestion);

  const isAtLastStep = activeIndex >= questions.length - 1;

  // ============================================================================
  // EMPTY (no questions)
  // ============================================================================

  if (questions.length === 0) {
    return (
      <PageLayout data-testid="survey-respond-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Pesquisas', href: '/hr/surveys' },
              { label: survey.title },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold">
              Esta pesquisa ainda não tem perguntas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Volte mais tarde ou peça ao responsável para adicionar perguntas
              antes de ativar.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 mt-4"
              onClick={() => router.push('/hr/surveys')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para pesquisas
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="survey-respond-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Pesquisas', href: '/hr/surveys' },
            { label: survey.title },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Hero / progress strip */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${typeColors.gradient} text-white`}
            >
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">{survey.title}</h1>
              {survey.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {survey.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={`${typeColors.bg} ${typeColors.text} border-0`}
                >
                  {SURVEY_TYPE_LABELS[survey.type]}
                </Badge>
                {survey.isAnonymous && (
                  <Badge
                    variant="outline"
                    className="bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300 border-0"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Suas respostas são anônimas
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {isProgressive
                  ? `Pergunta ${currentStep} de ${totalSteps}`
                  : `${questions.length} perguntas`}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {progressPct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-violet-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Questions */}
        {isProgressive ? (
          currentQuestion && (
            <Card
              className="bg-white dark:bg-slate-800/60 border border-border p-6 mt-4"
              data-testid={`survey-question-${activeIndex}`}
            >
              <QuestionBlock
                question={currentQuestion}
                index={activeIndex}
                answer={answers[currentQuestion.id]}
                onChange={partial =>
                  updateAnswer(currentQuestion.id, partial)
                }
              />
            </Card>
          )
        ) : (
          <div className="space-y-4 mt-4">
            {questions.map((question, index) => (
              <Card
                key={question.id}
                className="bg-white dark:bg-slate-800/60 border border-border p-6"
                data-testid={`survey-question-${index}`}
              >
                <QuestionBlock
                  question={question}
                  index={index}
                  answer={answers[question.id]}
                  onChange={partial => updateAnswer(question.id, partial)}
                />
              </Card>
            ))}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          {isProgressive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => setActiveIndex(previous => Math.max(0, previous - 1))}
              disabled={activeIndex === 0 || submitMutation.isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => router.push('/hr/surveys')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}

          {isProgressive && !isAtLastStep ? (
            <Button
              size="sm"
              className="h-9 px-2.5"
              onClick={() =>
                setActiveIndex(previous =>
                  Math.min(questions.length - 1, previous + 1)
                )
              }
              disabled={!canAdvanceCurrent}
            >
              Próxima
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 px-2.5"
              onClick={() => submitMutation.mutate()}
              disabled={!allRequiredAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Enviar respostas
                </>
              )}
            </Button>
          )}
        </div>

        {/* Required-warning */}
        {!allRequiredAnswered && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Responda todas as perguntas marcadas com{' '}
            <span className="text-rose-500">*</span> para enviar.
          </p>
        )}

        {allRequiredAnswered && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Tudo pronto para enviar.
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// QUESTION BLOCK
// ============================================================================

function QuestionBlock({
  question,
  index,
  answer,
  onChange,
}: {
  question: SurveyQuestion;
  index: number;
  answer: SurveyAnswer | undefined;
  onChange: (partial: Partial<SurveyAnswer>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-muted-foreground">
            #{index + 1}
          </span>
          {question.category && (
            <Badge
              variant="outline"
              className="text-xs bg-slate-100 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300 border-0"
            >
              {QUESTION_CATEGORY_LABELS[
                question.category as SurveyQuestionCategory
              ] ?? question.category}
            </Badge>
          )}
        </div>
        <h2 className="text-base font-semibold">
          {question.text}
          {question.isRequired && (
            <span className="text-rose-500 ml-1">*</span>
          )}
        </h2>
      </div>

      <SurveyAnswerInput
        type={question.type}
        options={question.options}
        value={answer}
        onChange={onChange}
      />
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function useMemoRequiredAnswered(
  questions: SurveyQuestion[],
  answers: Record<string, SurveyAnswer>
): boolean {
  return useMemo(() => {
    return questions
      .filter(question => question.isRequired)
      .every(question => {
        const answer = answers[question.id];
        if (!answer) return false;
        if (
          question.type === 'RATING_1_5' ||
          question.type === 'RATING_1_10' ||
          question.type === 'YES_NO' ||
          question.type === 'NPS'
        ) {
          return answer.ratingValue !== null && answer.ratingValue !== undefined;
        }
        if (question.type === 'TEXT') {
          return !!answer.textValue && answer.textValue.trim().length > 0;
        }
        if (question.type === 'MULTIPLE_CHOICE') {
          return (
            Array.isArray(answer.selectedOptions) &&
            answer.selectedOptions.length > 0
          );
        }
        return false;
      });
  }, [questions, answers]);
}
