+++
author = "Roman Zaynetdinov"
date = "2021-02-19T15:00:00+03:00"
title = "Log after web app context has been destroyed"
+++

I have updated our project's dependencies and suddenly I stopped getting logs after server is terminated. We run some clean up code when Spring context is destroyed and the logs were just not in my console.

```
[INFO] Stopped ServerConnector@4726a64c{HTTP/1.1, (http/1.1)}{0.0.0.0:18080}
[INFO] node0 Stopped scavenging
15:22:18,667 |-INFO in ch.qos.logback.classic.servlet.LogbackServletContextListener@5e91682d - About to stop ch.qos.logback.classic.LoggerContext [default]
[INFO] Closing Spring root WebApplicationContext
[INFO] Stopped o.e.j.m.p.JettyWebAppContext@51f311f3{/chatserver,[file:///webapp/, file:///another/webapp/],STOPPED}{[file:///webapp/, file:///another/webapp/]}
```

Luckily, there was a clue to what might be happening: `About to stop ch.qos.logback.classic.LoggerContext`. It seemed like logback had stopped before Spring context did. So the code was still run it simply didn't log anything ¯\\\_(ツ)\_/¯.

Huge thanks to this [StackOverflow answer](https://stackoverflow.com/a/49816008/2866570) that explains exactly what needs to be done.

```xml
<!-- web.xml -->
<context-param>
    <param-name>logbackDisableServletContainerInitializer</param-name>
    <param-value>true</param-value>
</context-param>

<!-- .... -->

<!-- Configure Logback first so that it will be destroyed last -->
<listener>
    <listener-class>ch.qos.logback.classic.servlet.LogbackServletContextListener</listener-class>
</listener>
<!-- other listeners follow -->
```
