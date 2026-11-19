import type { Ref } from "react";
import { RewardPriceGuidance } from "@/components/reward/RewardPriceGuidance";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { Input } from "@/components/ui/Input";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn } from "@/utils";
import type { RewardPriceAnalysis } from "@/utils/rewardEconomy";

export interface RewardPriceFieldProps {
  inputRef?: Ref<HTMLInputElement>;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  hasWarning?: boolean;
  guidanceType?: RewardType;
  packageLevel?: PackageLevel;
  priceAnalysis?: RewardPriceAnalysis;
  onApplySuggestedPrice?: (suggestedPrice: number) => void;
}

export function RewardPriceField({
  inputRef,
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
  hasWarning = false,
  guidanceType,
  packageLevel,
  priceAnalysis,
  onApplySuggestedPrice,
}: RewardPriceFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 min-h-5">
        <label
          htmlFor="rewardPrice"
          className="text-body-s text-neutral-100 font-medium"
        >
          {label} <span className="text-gold">*</span>
        </label>
        {hint && (
          <span className="text-label-m text-amber-700 dark:text-gold font-medium">
            {hint}
          </span>
        )}
      </div>
      <Input
        ref={inputRef}
        id="rewardPrice"
        type="number"
        step="any"
        min="0.01"
        max={99999}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        compact
        icon={<CoinIcon size={16} withGlow />}
        className={cn(
          "font-bold h-[42px]",
          hasWarning &&
            "border-amber-500/60 focus:border-amber-500 dark:border-amber-400/50 dark:focus:border-amber-400",
        )}
        required
        disabled={disabled}
      />
      {guidanceType && (
        <RewardPriceGuidance
          type={guidanceType}
          price={value}
          packageLevel={packageLevel}
          analysis={priceAnalysis}
          onApplySuggestedPrice={onApplySuggestedPrice}
          disabled={disabled}
        />
      )}
    </div>
  );
}
