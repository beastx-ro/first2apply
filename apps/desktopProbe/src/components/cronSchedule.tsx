import { AVAILABLE_CRON_RULES } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@first2apply/ui';

/**
 * Component used to set the cron schedule of the probe.
 */
export function CronSchedule({
  cronRule,
  onCronRuleChange,
}: {
  cronRule?: string;
  onCronRuleChange: (cron: string | undefined) => void;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-6 rounded-lg border p-6">
      <div className="space-y-1">
        <h2 className="text-lg">Search Frequency</h2>
        <p className="text-sm font-light">How often do you want to receive job notifications?</p>
      </div>
      <Select value={cronRule} onValueChange={onCronRuleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Never" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_CRON_RULES.map((rule) => (
            <SelectItem key={rule.value} value={rule.value}>
              {rule.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
