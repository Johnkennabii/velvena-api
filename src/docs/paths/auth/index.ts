import register from "./register.json" with { type: "json" };
import login from "./login.json" with { type: "json" };
import me from "./me.json" with { type: "json" };
import refresh from "./refresh.json" with { type: "json" };

export default {
  ...register,
  ...login,
  ...me,
  ...refresh,
};