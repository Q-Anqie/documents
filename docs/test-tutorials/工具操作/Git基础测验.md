---
description: Git 基础测验，检验提交、分支、冲突解决与撤销回滚掌握程度。
---
# Git 基础测验

!!! abstract "测验说明"
    本测验用于检验 Git 版本控制教程的学习效果。共 12 道选择题，建议在学完教程后独立完成。

    📗 入门难度
    ⏱ 约 20 分钟
    📝 12 道选择题

!!! tip "测验反馈"
    提交答案后，系统会显示：

    - 得分和正确率
    - 错题分析和薄弱知识点
    - 复习建议和推荐教程
    - 下一步学习建议

---

## 选择题

Git 中"暂存区"的作用是？

 永久保存代码的地方
 存放准备提交的修改快照，便于选择性提交
 存放远程分支的本地副本
 存放被删除的历史文件

💡 Git 有三层：工作区 → 暂存区 → 版本库。暂存区让你能把本次要提交的内容挑出来，而不是把工作区所有改动一股脑提交

把某个文件的修改加入暂存区，应该用哪个命令？

 git add file.py
 git commit file.py
 git stage --all file.py
 git push file.py

💡 用 `git add` 把改动放进暂存区，再用 `git commit` 提交。`git push` 是把本地提交推到远程，用途不同

已经跟踪的文件想跳过 `git add` 直接提交，可以用？

 git commit --fast -m "msg"
 git commit --skip-add -m "msg"
 git commit -am "msg"
 git push -m "msg"

💡 `-a` 表示自动暂存**已跟踪**文件的修改，`-m` 是提交信息。注意它对新增的未跟踪文件无效，新文件仍要先 `git add`

想查看"已暂存但还没提交"的改动，应该用哪个命令？

 git diff HEAD~1
 git log -p
 git status -v
 git diff --staged

💡 `git diff` 看工作区 vs 暂存区；`git diff --staged`（等价 `--cached`）看暂存区 vs 上次提交；`git diff HEAD` 看工作区 vs 上次提交

创建并切换到新分支 `feature/login`，正确写法是？

 git branch -d feature/login
 git switch -c feature/login（等价 git checkout -b）
 git merge feature/login
 git remote add feature/login

💡 `git switch -c` 是 Git 2.23+ 的新命令，与经典的 `git checkout -b` 等价。`git branch -d` 是删除分支

`git reset` 和 `git revert` 最本质的区别是？

 两者完全等价，只是命令名不同
 reset 用于撤销工作区，revert 用于撤销暂存区
 reset 移动 HEAD 指针改写历史，revert 生成一个反向提交、不改写历史
 reset 只能撤销一次，revert 可以撤销多次

💡 已推送到公共分支的提交要用 `git revert`（安全，留下反向提交记录）；`git reset --hard` 会丢弃提交，只适合本地未推送的历史

手动解决完冲突后，下一步必须做什么？

 git add 标记文件已解决，再 git commit 完成合并
 直接 git push，Git 会自动完成合并
 立刻 git merge --abort 放弃合并
 不需要额外操作，保存文件就自动完成

💡 冲突解决流程是：编辑文件删掉 `<<<<<<<`、`=======`、`>>>>>>>` 标记 → `git add` 标记已解决 → `git commit` 完成合并。中途想反悔用 `git merge --abort`

正在改一个用例，临时需要切分支修 Bug，又不想把半成品提交，应该用？

 git commit -am "wip"
 git reset --hard
 git clean -fd
 git stash

💡 `git stash` 把未完成的修改临时存起来，切回来再用 `git stash pop` 恢复。比提交一个 "wip" 干净，也不会像 `reset --hard` 那样直接丢代码

想用一行一条的简洁形式查看提交历史，应该用？

 git status --history
 git log --oneline
 git diff --log
 git show --all

💡 `git log --oneline` 每条提交压缩成一行（短 hash + 提交说明），排查"哪次改动引入的问题"时最常用

`git pull` 等价于哪两个操作的组合？

 clone + push
 add + commit
 fetch + merge
 branch + checkout

💡 `pull` = `fetch` + `merge`，所以可能直接产生冲突。想先看看远程有什么变动再决定合并，就先单独执行 `git fetch`

误用 `git reset --hard` 丢掉了本地提交，还有机会找回吗？

 可以，用 git reflog 找到被丢弃提交的 hash 再恢复
 不可以，reset --hard 是永久性删除
 可以，但只能通过重新克隆远程仓库
 可以，只要之前执行过 git push

💡 `git reflog` 记录了 HEAD 的每次移动，即使提交已不在任何分支上，也能找回 hash 并恢复。这是"手滑救回"的关键命令

按照 Git 安全准则，下面哪种内容最不应该提交到仓库？

 自动化测试用例脚本
 测试计划与用例文档
 项目的 README 说明
 数据库密码、密钥等敏感信息

💡 密码、密钥、证书这类敏感信息一旦推送到远程就会留在历史里，很难彻底清除。应通过 `.gitignore` 排除，并用环境变量或配置模板替代

提交答案

---

## 继续学习

完成测验后，建议继续学习：

- [Git 版本控制教程](Git版本控制教程-软件测试版.md) - 查看完整教程
- [章节练习与参考答案](../章节练习与参考答案.md) - 更多工具练习
- [Docker 基础测验](Docker基础测验.md) - 继续检验容器基础
