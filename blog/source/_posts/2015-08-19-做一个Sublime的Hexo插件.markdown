---
layout: post
title: "做一个Sublime的Hexo插件"
date: 2015-08-19 17:17:19 +0800
comments: true
categories: "tool"
tags: ["hexo", "sublime", "python"]
---
<!-- toc -->
[Hexo](https://hexo.io/)是款很适合程序猿使用的博客框架，同octopress一样使用markdown编写博文，不同的是采用node.js来生成静态网页，速度更快。

Markdown的编辑器也有很多，[Mou](http://25.io/mou/)就是一个很好的选择。还有在线编辑器，如[马克飞象](http://www.maxiang.info/)。当然，忽略实时预览的话，任何文本编辑器也是都可以胜任的，比如[Sublime](http://www.sublimetext.com/)。为了更加肆意地懒惰，决定开发一个对应Hexo的Sublime插件。

# Sublime插件开发

## 新建插件

* Preferences -> Browse Packages... 新建目录，用来存放我们的插件，这里就叫做BlogAssistant
* Tools->New Plugin... 创建新的插件，命名为BlogAssistant.py保存在之前的文件夹下
* ctrl+`打开控制台，输入view.run_command('example')，如果当前文档前插入了"Hello, World!"则表明创建成功

## 设置快捷键

创建对应各平台的快捷键文件Default (Linux).sublime-keymap, Default (OSX).sublime-keymap, Default (Windows).sublime-keymap。内容为json格式，如下例所示：

```
[
    { "keys": ["ctrl+shift+p"], "command": "blog_assistant_push" },
    { "keys": ["ctrl+shift+v"], "command": "blog_assistant_preview" }
]
```

其中blog_assistant_push对应BlogAssistant.py中的BlogPusherPreviewCommand


```
class BlogPusherPreviewCommand(sublime_plugin.TextCommand):
	def run(self, edit):
		...
```

## 配置文件

### 创建

新建配置文件BlogAssistant.sublime-settings，格式同样为json

```
{
    "blog_path": "/Users/yuewenduo/Documents/Workspace/Hexo/blog"
}
```

### 读取

```
def loadSettings(name):
    return sublime.load_settings(name+".sublime-settings")
```

## 调用shell

使用命令[subprocess.Popen](https://docs.python.org/2/library/subprocess.html)来调用shell，比如：


```
process = subprocess.Popen("ls -l", shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
for line in process.stdout.readlines():
	print line
```

### 发布


看起来很简单是不是？那我们马上试试H调用exo的deploy命令吧。

```
process = subprocess.Popen("hexo d", shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
for line in process.stdout.readlines():
	print line
```

输出信息会告诉我们找不到hexo命令。因为脚本运行时没有得到与shell完全相同的环境变量，不要紧，有一个env参数我们还没有使用呢。env要怎么传入环境变量呢，在官方文档可以看到env={"PATH": "/usr/bin"}这样的用法，如果要传入跟shell环境相同的PATH可以这样env=os.environ。加上env参数后马上再去试试吧，你就会发现仍然不行……

which hexo看一下输出，路径为/usr/local/bin。再打印一下os.environ，居然没有/usr/local/bin，好吧，先手动加上再说。

ok，hexo命令找到了，新的问题又来了，输出信息为hexo的help，告诉我们用错了指令，因为当前路径是我们的插件目录，我们还需要切换工作路径，使用cwd参数，最终代码如下：

```
settings = helper.loadSettings("BlogAssistant")
blog_path = settings.get("blog_path", "")

process = subprocess.Popen("hexo g && hexo d", cwd=blog_path, shell=True, env={'PATH':os.environ['PATH']+":/usr/local/bin"}, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
for line in process.stdout.readlines():
	print line
```

因为我使用了私钥所以省去了账号和密码，同时在git目录.config文件中加入了

```
[user]  
        name = yourname  
        email = youemail@gmail.com
```
从而又省去了在python环境下调用"git config --global"的过程，懒就要懒到底。

### 预览

预览功能要比发布功能麻烦一些。

* 问题一：hexo server是通过node.js建立webserver的，进程需要手动结束。

在终端中我们可以ctrl+c来退出。因此，如果我们要做预览功能，同时还要做关闭server的功能。

* 问题二：端口可能已经被占用。

需要判断占用端口的进程是否是我们通过本插件建立的，如果是则跳过，否则先kill掉进程再调用hexo server。

方法如下：

```
def kill(pid):
    try:
        a = os.kill(pid, signal.SIGKILL)
        print 'pid:%s killed, result:%s' % (pid, a)
    except OSError, e:
        print 'pid not exists'

def try_kill_process():
        p = subprocess.Popen("lsof -a -c node -i:4000 -Fp", shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        for pid in p.stdout.readlines():
		    helper.kill(string.atoi(pid[1:]))
```

这样我们就先解决了问题二，给这个kill方法加个快捷键，我们就解决了问题一。

下面直接给出最终的预览功能代码：

```
class BlogAssistantPreviewCommand(sublime_plugin.TextCommand):
	def run(self, edit):
		try_kill_process()
		settings = helper.loadSettings("BlogAssistant")
		blog_path = settings.get("blog_path", "")
		process = subprocess.Popen("hexo g", cwd=blog_path, shell=True, env={'PATH':os.environ['PATH']+":/usr/local/bin"})
		process.wait()
		subprocess.Popen("hexo s", cwd=blog_path, shell=True, env={'PATH':os.environ['PATH']+":/usr/local/bin"})
		time.sleep(1)
		webbrowser.open("http://localhost:4000/")
```

解释一下webbrowser.open会调用默认浏览器打开页面，从体验上讲，我们希望打开页面时，hexo已经生成了静态网页，所以在hexo generate后加了wait命令，用来阻塞进程。之后调用hexo server，我们希望打开网页时webserver已经建立好了，这时就不能用wait了，记得我们在终端下执行hexo server的情景吗？除非手动退出，否则进程不会终止，如果在这里wait，sublime会死掉，所以改为sleep，延时多久自行尝试吧，可以是小数。

## 结语

至此，预览和发布这两个常用功能就开发完了，后续想到什么其他功能在继续补充吧。暂时还没有发布到sublime官方的Package Control上的想法，预览功能从产品角度讲存在很多问题，发布功能缺少反馈，而且插件没有在其他平台测试过。因此，真的觉得有用的话，自己把代码copy走吧。

另外，这篇博客就是用插件发布的哟。

## 参考
[How to Create a Sublime Text 2 Plugin](http://code.tutsplus.com/tutorials/how-to-create-a-sublime-text-2-plugin--net-22685)
