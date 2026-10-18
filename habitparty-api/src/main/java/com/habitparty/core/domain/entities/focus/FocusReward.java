package com.habitparty.core.domain.entities.focus;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record FocusReward(int xp, BigDecimal coins) {
  public static final FocusReward ZERO = new FocusReward(0, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

  public FocusReward {
    if (coins == null) {
      coins = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    } else {
      coins = coins.setScale(2, RoundingMode.HALF_UP);
    }
    if (xp < 0) {
      xp = 0;
    }
  }
}
