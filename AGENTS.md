# 本地编辑约定

- 后续本地界面和交互修改以用户指定的参考页面为准：
  https://minecraft-inventory-builder.com/builder/inventory/33033#builder
- 修改前查看参考页面的实际状态，重点核对顶部工具栏、物品库、背包预览、Item Stack 和 Button 配置区。
- 沿用当前静态 HTML、CSS、JavaScript 结构及本地资源，保持离线运行和 zMenu YAML 导入导出。
- 基于工作区现有修改继续编辑，保留用户未提交的变更。
- 验证命令：`node --test tests/*.test.cjs`。涉及布局时同时在浏览器核对实际效果。
