/**
 * 環境変数の読み込み
 * 他のモジュールより先にインポートすること
 */
import { config } from "dotenv";

config({ path: ".env.local" });
