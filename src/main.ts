import { createApp } from "vue";
import "virtual:uno.css";
import "./reset.css";
import "./tech-styles.css";
import "./windows-input-fix.css"; // Windows 输入修复样式
import "./styles/drag-drop.css"; // 拖拽样式
import Antd from "ant-design-vue";
import App from "./App.vue";

// 引入 Windows 输入修复器
import "./utils/windows-input-fixer";

const app = createApp(App);

app.use(Antd);
app.mount("#app");
