import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@codeware/shared/ui/shadcn/components/alert';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export type ResolverReportProps = {
  /** One row per resolver, in the order they were asked */
  answers: Array<{
    resolver: string;
    records: Array<string>;
    error?: string;
  }>;
  /** Whether every resolver that answered said the same thing */
  agree: boolean;
  /** Pre-composed sentence naming the negative-cache window, when it is known */
  negativeCacheNote?: string | null;
  labels: {
    heading: string;
    /** What agreement means: the problem is on the asker's side */
    agreeLede: string;
    /** What disagreement means: mid-propagation, wait it out */
    disagreeLede: string;
    /** Shown for a resolver that has no record yet */
    noAnswer: string;
    /** Shown for a resolver that could not be reached at all */
    unreachable: string;
  };
};

/**
 * What each public resolver says about the domain right now.
 *
 * The point is not what any single resolver returns — it is whether they
 * differ. All three agreeing while a browser still cannot reach the domain
 * places the stale copy on the asker's own side, which is the one conclusion
 * no amount of staring at the records will produce.
 */
export function ResolverReport({
  answers,
  agree,
  negativeCacheNote,
  labels
}: ResolverReportProps) {
  if (!answers.length) {
    return null;
  }

  return (
    <Alert variant="default">
      {agree ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
      <AlertTitle>{labels.heading}</AlertTitle>
      <AlertDescription>
        <p>{agree ? labels.agreeLede : labels.disagreeLede}</p>
        <ul className="flex w-full flex-col gap-1">
          {answers.map((answer) => (
            <li
              key={answer.resolver}
              className="flex flex-wrap items-baseline gap-x-2"
            >
              <span className="font-medium">{answer.resolver}</span>
              <span className="font-mono text-xs break-all">
                {answer.error
                  ? labels.unreachable
                  : answer.records.length
                    ? answer.records.join(', ')
                    : labels.noAnswer}
              </span>
            </li>
          ))}
        </ul>
        {negativeCacheNote && <p className="text-xs">{negativeCacheNote}</p>}
      </AlertDescription>
    </Alert>
  );
}
