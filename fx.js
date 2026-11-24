/* 学习打卡 · 21 套打卡动效（由 design-demos/themes-21.html 迁移，勿手改）
 *
 * 坐标系：设计稿手机屏 312×548。这里原样保留，外层 .fxStage 用
 * transform:scale(var(--fxs)) 等比放大到真机宽度（390/312 = 1.25）。
 * 所以本文件里所有 px 值都是「设计稿像素」，不是真机像素。
 *
 * 用法：SB_FX.play('s01', {words:128, streak:12, pct:33})
 */
(function () {
'use strict';

var R=function(){return Math.random();};
var DEG=Math.PI/180;

/* ══ 动效样式 ══ */
/* .fxStage 的宽高与 transform 全由 fit() 在运行时设置（见文件末），
   这里不要写死 548 —— 画布会被拉长到铺满屏。
   overflow 必须 visible：舞台本身比屏高时要允许出血；
   真正的裁切由外层 .fxLayer（position:fixed;inset:0;overflow:hidden）负责。 */
var CSS = String.raw`.fxStage{position:absolute;left:0;top:0;
  width:312px;height:548px;
  overflow:visible;pointer-events:none;
  transform-origin:0 0}
.fxm{position:absolute;inset:0;display:grid;place-items:center}

@keyframes kDrop{0%{opacity:0;transform:translateY(-200px) scale(.35) rotate(-24deg)}
 52%{opacity:1;transform:translateY(8px) scale(1.13) rotate(-8deg)}
 74%{transform:translateY(-4px) scale(.965) rotate(-9.5deg)}
 100%{opacity:1;transform:translateY(0) scale(1) rotate(-9deg)}}
@keyframes kPop{0%{opacity:0;transform:scale(.15) rotate(var(--rot,0deg))}
 58%{opacity:1;transform:scale(1.15) rotate(var(--rot,0deg))}
 100%{opacity:1;transform:scale(1) rotate(var(--rot,0deg))}}
@keyframes kRise{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
@keyframes kFade{0%{opacity:0}100%{opacity:1}}
@keyframes kBurst{0%{opacity:0;transform:translate(0,0) scale(.3) rotate(0)}
 20%{opacity:1}100%{opacity:0;transform:translate(var(--dx,0),var(--dy,0)) scale(.85) rotate(var(--rot,140deg))}}
@keyframes kDrift{0%{opacity:0;transform:translate(var(--x0,0),-24px) rotate(0)}
 14%{opacity:1}100%{opacity:0;transform:translate(calc(var(--x1,0px)),250px) rotate(var(--rot,120deg))}}
@keyframes kRing{0%{opacity:0;transform:scale(.55)}16%{opacity:.9}100%{opacity:0;transform:scale(1.72)}}
@keyframes kRay{0%{opacity:0;transform:rotate(var(--a)) translateY(-52px) scaleY(.4)}
 26%{opacity:.95}100%{opacity:0;transform:rotate(var(--a)) translateY(-118px) scaleY(.72)}}
/* 印章砸下时的白光。原本冲到 .82，整屏糊白 80ms；
   加了冲击层之后爆白已由 impFlash 负责，这层再亮就重复了，
   峰值压到 .22，只保留「印章落地那一瞬有光」的感觉。 */
@keyframes kFlash{0%{opacity:0}32%{opacity:.22}100%{opacity:0}}
@keyframes kSweepIn{0%{opacity:0;transform:translateX(-110%)}100%{opacity:1;transform:translateX(0)}}
@keyframes kSweepInR{0%{opacity:0;transform:translateX(110%)}100%{opacity:1;transform:translateX(0)}}
@keyframes kSweepOnce{0%{opacity:0;transform:translateX(-100%)}
 18%{opacity:1}72%{opacity:1}100%{opacity:0;transform:translateX(320%)}}
@keyframes kSweepOnce2{0%{opacity:0;transform:translateX(100%)}
 18%{opacity:1}72%{opacity:1}100%{opacity:0;transform:translateX(-320%)}}
@keyframes kSlice{0%{opacity:0;transform:translate(-150%,-150%) skewX(-14deg)}
 16%{opacity:.95}68%{opacity:.95}100%{opacity:0;transform:translate(80%,80%) skewX(-14deg)}}
@keyframes kSpiral{0%{opacity:0;transform:rotate(0) scale(.45)}
 38%{opacity:1}100%{opacity:.14;transform:rotate(190deg) scale(1.28)}}
@keyframes kGrowY{0%{opacity:0;transform:scaleY(0)}100%{opacity:1;transform:scaleY(1)}}
@keyframes kMark{0%{opacity:0;transform:translateX(-110%) scaleX(.5)}
 38%{opacity:.62}100%{opacity:.5;transform:translateX(0) scaleX(1)}}
@keyframes kFlip{0%{transform:perspective(700px) rotateY(0)}100%{transform:perspective(700px) rotateY(-172deg)}}
@keyframes kFlip2{0%{opacity:0;transform:perspective(900px) rotateY(0)}
 12%{opacity:1}
 46%{opacity:1;transform:perspective(900px) rotateY(-58deg)}
 78%{opacity:.9;transform:perspective(900px) rotateY(-124deg)}
 100%{opacity:0;transform:perspective(900px) rotateY(-168deg)}}
@keyframes kFloatUp{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(var(--dy,-46px))}}
@keyframes kBreath{0%{opacity:0;transform:scale(.86)}50%{opacity:1;transform:scale(1.03)}100%{opacity:.8;transform:scale(1)}}
@keyframes kChibi{0%{opacity:0;transform:translateY(100px)}
 20%{opacity:1;transform:translateY(-6px)}
 28%{transform:translateY(3px)}
 36%{transform:translateY(-2px)}
 44%{transform:translateY(0)}
 78%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(92px)}}
@keyframes kBlink{0%,100%{transform:scaleY(1)}46%,54%{transform:scaleY(.08)}}
@keyframes kPulse{0%{opacity:0;transform:scale(.7)}45%{opacity:.9;transform:scale(1.1)}100%{opacity:0;transform:scale(1.5)}}
@keyframes kDrip{0%{opacity:0;transform:translateY(-10px) scaleY(.4)}
 40%{opacity:.9}100%{opacity:0;transform:translateY(46px) scaleY(1.5)}}
@keyframes kStamp2{0%{opacity:0;transform:scale(1.6) rotate(-16deg)}
 55%{opacity:.95;transform:scale(.94) rotate(-4deg)}100%{opacity:1;transform:scale(1) rotate(-4deg)}}
@keyframes kTick{to{stroke-dashoffset:0}}
@keyframes kSunUp{0%{opacity:0;transform:translateY(56px) scale(.7)}
 55%{opacity:.9}100%{opacity:.92;transform:translateY(-6px) scale(1)}}
@keyframes kDrawX{0%{opacity:1;transform:scaleX(0)}100%{opacity:1;transform:scaleX(1)}}
@keyframes kWash{0%{opacity:0;transform:scale(.2)}35%{opacity:.55}
 70%{opacity:.42;transform:scale(1)}100%{opacity:.3;transform:scale(1.14)}}
@keyframes kGust{0%{opacity:0;transform:translateX(-100%)}
 40%{opacity:.22}100%{opacity:0;transform:translateX(100%)}}
@keyframes kCatRoll{0%{opacity:0;transform:translateX(130px) rotate(0)}
 26%{opacity:1;transform:translateX(0) rotate(-9deg)}
 48%{transform:translateX(0) rotate(7deg)}
 72%{opacity:1;transform:translateX(0) rotate(0)}
 100%{opacity:0;transform:translateX(-24px) rotate(-5deg)}}
@keyframes kFlood{0%{opacity:0;height:0}30%{opacity:.5}100%{opacity:.42;height:100%}}
@keyframes kFlood2{0%{opacity:0;height:0}34%{opacity:1}100%{opacity:1;height:74%}}
@keyframes kCloudIn{0%{opacity:0;transform:translate(-50%,-50%) rotate(-24deg) scale(.42)}
 38%{opacity:1}100%{opacity:.2;transform:translate(-50%,-50%) rotate(146deg) scale(1.12)}}

/* 01 */
.fxF{position:absolute;inset:0;background:#fff;opacity:0;animation:kFlash .26s 235ms both}
.seal{width:126px;height:126px;position:relative;display:grid;place-items:center;
  opacity:0;animation:kDrop .74s cubic-bezier(.22,1.35,.36,1) both;z-index:3}
.fx-scrim{position:absolute;inset:0;background:rgba(0,0,0,.42);opacity:0;
  animation:kFade .3s 120ms both;z-index:1}
.seal .sd{position:absolute;inset:0;border-radius:50%;background:var(--c1);
  border:3px solid var(--ob);box-shadow:6px 6px 0 var(--ob)}
.seal .sr{position:absolute;inset:10px;border-radius:50%;border:1.5px dashed rgba(0,0,0,.4)}
.seal .st{position:relative;z-index:2;text-align:center;color:#0B0B0B;
  font-family:Impact,"Arial Black",sans-serif}
.seal .st span{display:block;font-size:6.5px;letter-spacing:.2em;opacity:.6}
.seal .st b{display:block;font-size:44px;line-height:.86;letter-spacing:-.03em}
.ring{position:absolute;width:126px;height:126px;border-radius:50%;border:3px solid var(--c);
  opacity:0;animation:kRing .66s cubic-bezier(.16,.8,.3,1) both}
.ray{position:absolute;width:3px;height:28px;background:var(--c);border-radius:2px;
  opacity:0;transform-origin:50% 50%;animation:kRay .54s cubic-bezier(.14,.86,.3,1) both}
.bit{position:absolute;width:9px;height:9px;background:var(--c);border:2px solid #0B0B0B;
  opacity:0;animation:kBurst .72s cubic-bezier(.3,.7,.4,1) both}
.stk{position:absolute;font-family:Impact,"Arial Black",sans-serif;font-size:11px;
  font-weight:800;padding:6px 11px;border:2.5px solid #0B0B0B;background:var(--c);
  box-shadow:3px 3px 0 #0B0B0B;opacity:0;animation:kPop .42s cubic-bezier(.2,1.4,.4,1) both;
  white-space:nowrap}

/* 02 */
.dood{position:absolute;opacity:0;animation:kBurst .84s cubic-bezier(.2,.8,.3,1) both;
  font-weight:900;line-height:1}
.squig{position:absolute;width:34px;height:11px;border:2.6px solid var(--c);border-radius:8px;
  border-right-color:transparent;border-top-color:transparent;opacity:0;
  animation:kBurst .82s cubic-bezier(.2,.8,.3,1) both}
.tagz{font-family:"PingFang SC",sans-serif;font-size:11.5px;font-weight:800;
  padding:7px 12px;background:#fff;border:2.6px solid var(--c);border-radius:14px;opacity:0;
  animation:kPop .45s cubic-bezier(.2,1.4,.4,1) both;white-space:nowrap}
.tagWrap{position:absolute;left:0;right:0;bottom:60px;display:flex;justify-content:center;
  pointer-events:none}

/* 03 */
.stk2{position:absolute;font-family:"Arial Black",sans-serif;font-size:11.5px;font-weight:900;
  padding:7px 12px;color:var(--fg);border:2px solid var(--fg);
  box-shadow:4px 4px 0 var(--fg);opacity:0;
  animation:kPop .4s cubic-bezier(.2,1.5,.4,1) both;white-space:nowrap;z-index:3}
.popT{position:absolute;font-family:Impact,"Arial Black",sans-serif;font-size:40px;
  font-weight:900;color:var(--c);-webkit-text-stroke:3px #101010;
  text-shadow:4px 4px 0 #101010;opacity:0;left:8%;top:78%;
  animation:kPop .5s cubic-bezier(.18,1.5,.4,1) both;letter-spacing:-.02em;z-index:4}

/* 04 */
.sweepB{position:absolute;top:0;bottom:0;left:0;width:56%;opacity:0;pointer-events:none;
  animation:kSweepOnce 1.5s cubic-bezier(.32,.72,.28,1) both;
  background:linear-gradient(96deg,rgba(255,255,255,0) 0%,var(--c) 22%,var(--c) 62%,rgba(255,255,255,0) 100%)}
.sweepL{opacity:.42}
.sweepR{animation:kSweepOnce2 1.5s cubic-bezier(.32,.72,.28,1) 120ms both;opacity:.42}
.hline{position:absolute;left:0;right:0;top:52%;height:1px;opacity:0;background:var(--c);
  animation:kFade .3s 520ms both;z-index:2}
.recT{position:absolute;font-family:"Helvetica Neue",sans-serif;font-size:9.5px;font-weight:400;
  letter-spacing:.3em;color:var(--c);opacity:0;animation:kRise .4s .62s both;
  left:50%;top:44%;transform:translate(-50%,0);white-space:nowrap;z-index:3}

/* 05 */
.glowB{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,var(--c),transparent 62%);
  opacity:0;animation:kBreath 1.5s ease-out both}
.moonC{position:absolute;width:58px;height:58px;border-radius:50%;background:#F7E3B0;
  box-shadow:0 0 30px 8px rgba(247,227,176,.42);opacity:0;right:9%;top:14%;
  animation:kBreath 1.6s ease-out both}
.starP{position:absolute;border-radius:50%;opacity:0;background:var(--c);
  box-shadow:0 0 5px rgba(169,160,219,.55);animation:kPulse 1.5s ease-out both;z-index:1}
.softT{position:absolute;font-family:"PingFang SC",sans-serif;font-size:11.5px;font-weight:300;
  letter-spacing:.08em;opacity:0;animation:kRise .7s cubic-bezier(.2,.9,.3,1) both;
  white-space:nowrap;z-index:3}

/* 06 */
.veil{position:absolute;inset:0;opacity:0;animation:kBreathVeil 1.4s ease-out both;
  background:linear-gradient(180deg,var(--c),transparent 72%)}
.ribP{position:absolute;opacity:0;animation:kDrift 1.5s cubic-bezier(.3,.1,.5,1) both;line-height:1}

/* 07 */
.sliceB{position:absolute;left:-30%;width:260%;height:62px;opacity:0;background:var(--c);
  animation:kSlice .58s cubic-bezier(.2,.85,.25,1) both;z-index:2}
.halftone{position:absolute;inset:0;opacity:0;
  background-image:radial-gradient(rgba(230,255,61,.55) 1px,transparent 1px);
  background-size:7px 7px;animation:kHalf .42s .12s both;z-index:2}
@keyframes kHalf{0%{opacity:0}22%{opacity:.42}55%{opacity:.16}100%{opacity:0}}
.tokyoT{position:absolute;font-family:"Arial Narrow",sans-serif;font-size:10.5px;font-weight:800;
  letter-spacing:.34em;opacity:0;animation:kRise .4s .42s both;white-space:nowrap}

/* 08 */
.discW{position:relative;width:186px;height:186px;border-radius:50%;border:1px solid var(--c);
  opacity:0;box-shadow:inset 0 0 40px rgba(228,192,121,.07);
  animation:kSpiral 1.7s cubic-bezier(.2,.8,.3,1) both}
.nodeD{position:absolute;width:7px;height:7px;border-radius:50%;opacity:0;
  background:var(--c);box-shadow:0 0 10px 2px rgba(228,192,121,.55);
  animation:kPop .4s cubic-bezier(.2,1.4,.4,1) both;z-index:2}
.lineD{position:absolute;height:1px;transform-origin:0 50%;opacity:0;
  background:linear-gradient(90deg,var(--c),transparent);
  animation:kDrawX .55s cubic-bezier(.4,.7,.3,1) both;z-index:1}
.coreD{position:absolute;width:12px;height:12px;border-radius:50%;opacity:0;
  background:var(--c);left:50%;top:50%;transform:translate(-50%,-50%);
  box-shadow:0 0 20px 5px rgba(228,192,121,.65);animation:kBreath .9s ease-out both;z-index:3}
.zT{position:absolute;font-family:"Songti SC",serif;font-size:10.5px;font-weight:400;
  letter-spacing:.3em;opacity:0;animation:kRise .6s cubic-bezier(.2,.9,.3,1) both;white-space:nowrap;z-index:4}

/* 09 */
.stemV{position:absolute;width:2.5px;transform-origin:50% 100%;
  opacity:0;background:var(--c);border-radius:2px;animation:kGrowY .75s ease-out both;z-index:1}
.leafV{position:absolute;width:19px;height:11px;border-radius:50% 0 50% 0;opacity:0;
  background:var(--c);animation:kPop .42s cubic-bezier(.2,1.3,.4,1) both}
.bloomV{position:absolute;width:14px;height:14px;border-radius:50%;opacity:0;
  box-shadow:0 0 0 4px rgba(232,199,123,.26);animation:kPop .5s cubic-bezier(.2,1.4,.4,1) both}
.vineT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.1em;opacity:0;animation:kRise .7s both;white-space:nowrap;z-index:3}

/* 10 */
.markB{position:absolute;left:-6%;width:112%;height:24px;opacity:0;border-radius:4px;
  background:var(--c);animation:kMark .58s cubic-bezier(.3,.6,.3,1) both;z-index:2}
.markerT{position:absolute;font-family:"Arial Rounded MT Bold",sans-serif;font-size:11.5px;
  font-weight:800;opacity:0;animation:kRise .5s both;white-space:nowrap;z-index:3}

/* 11 */
.icoP{position:absolute;opacity:0;line-height:1;font-weight:900;
  animation:kBurst .7s cubic-bezier(.2,.9,.3,1) both}
.goT{position:absolute;font-family:Impact,sans-serif;font-size:12.5px;font-weight:900;
  letter-spacing:.1em;padding:8px 14px;border:2.5px solid #1A1420;border-radius:20px;
  box-shadow:3px 3px 0 #1A1420;opacity:0;
  animation:kPop .45s cubic-bezier(.2,1.4,.4,1) both;white-space:nowrap}
.goWrap{position:absolute;left:50%;margin-left:-46px;bottom:150px;pointer-events:none}

/* 12 */
.chibi{position:absolute;width:86px;height:86px;border-radius:50%;
  border:3px solid var(--ob);background:#FFFDF7;z-index:4;
  bottom:19%;left:50%;margin-left:-43px;opacity:0;
  animation:kChibi 2.2s cubic-bezier(.2,.9,.3,1) both;
  box-shadow:0 6px 0 rgba(31,31,31,.14)}
.ch-eye{position:absolute;left:21px;top:31px;display:flex;gap:17px;z-index:2}
.ch-eye i{width:8px;height:10px;border-radius:50%;background:var(--ob);display:block;
  animation:kBlink 1.1s .55s}
.ch-cheek{position:absolute;left:12px;top:48px;display:flex;gap:36px;z-index:2}
.ch-cheek i{width:12px;height:6px;border-radius:50%;background:#F7A8B8;display:block;
  opacity:0;animation:kFade .4s .8s both;box-shadow:0 0 0 .5px rgba(247,168,184,.4)}
.ch-mouth{position:absolute;left:37px;top:48px;width:12px;height:6px;z-index:2;
  border-bottom:2.5px solid var(--ob);border-radius:0 0 9px 9px}
.ch-hood{position:absolute;left:50%;top:-11px;width:22px;height:13px;margin-left:-11px;
  border:3px solid var(--ob);border-radius:50% 50% 0 0;background:var(--c);z-index:3}
.bub{position:absolute;font-family:"PingFang SC",sans-serif;font-size:11px;font-weight:700;
  padding:8px 12px;background:#fff;border:2.5px solid;border-radius:16px 16px 16px 4px;
  opacity:0;animation:kPop .45s cubic-bezier(.2,1.4,.4,1) both;white-space:nowrap}

/* 13 */
.tickS{width:128px;height:86px;opacity:0;animation:kFade .25s .1s both}
.tickS path{stroke-dasharray:200;stroke-dashoffset:200;
  animation:kTick .62s cubic-bezier(.3,.7,.3,1) .12s forwards}
.steamS{position:absolute;bottom:52%;width:2px;height:15px;border-radius:2px;opacity:0;
  background:var(--c);animation:kDrip 1.1s ease-out both}
.diaryT{position:absolute;font-family:"PingFang SC",sans-serif;font-size:11px;font-weight:600;
  opacity:0;animation:kRise .55s both;white-space:nowrap;z-index:3}

/* 14 */
.sunC{position:absolute;width:62px;height:62px;border-radius:50%;top:13%;right:11%;opacity:0;
  background:var(--c);animation:kSunUp 1.5s cubic-bezier(.2,.7,.3,1) both}
.skyL{position:absolute;left:0;right:0;top:72%;height:1px;transform-origin:0 50%;opacity:0;
  background:var(--c);animation:kDrawX .9s cubic-bezier(.3,.6,.3,1) both}
.skyT{position:absolute;font-family:"PingFang SC",sans-serif;font-size:12px;font-weight:300;
  letter-spacing:.14em;opacity:0;animation:kRise .7s both;white-space:nowrap;z-index:3}

/* 15 */
.washB{position:absolute;border-radius:50%;opacity:0;filter:blur(9px);background:var(--c);
  animation:kWash 1.4s cubic-bezier(.2,.7,.3,1) both}
.washT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.08em;opacity:0;animation:kRise .7s both;white-space:nowrap;z-index:4}

/* 16 */
.mountI{position:absolute;left:0;right:0;bottom:0;height:30%;opacity:0;background:var(--c);
  clip-path:polygon(0 100%,0 62%,14% 40%,26% 55%,42% 24%,58% 48%,72% 30%,88% 52%,100% 38%,100% 100%);
  animation:kFade 1.1s .1s both}
.inkW{position:absolute;width:204px;height:204px;border-radius:50%;opacity:0;filter:blur(26px);
  background:var(--c);animation:kWash 1.6s cubic-bezier(.2,.7,.3,1) both}
.lampL{position:absolute;width:10px;height:10px;border-radius:50%;bottom:26%;opacity:0;
  background:var(--c);animation:kBreath 1.5s .5s ease-out both}
.inkT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.24em;opacity:0;animation:kRise .8s both;white-space:nowrap;z-index:4}

/* 17 */
.gustW{position:absolute;inset:0;opacity:0;animation:kGust 1s cubic-bezier(.3,.6,.3,1) both;
  background:linear-gradient(105deg,transparent 32%,var(--c) 50%,transparent 68%)}
.petalW{position:absolute;opacity:0;border-radius:50% 0 50% 0;
  animation:kBurst 1.1s cubic-bezier(.2,.8,.3,1) both}
.windT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.1em;opacity:0;animation:kRise .7s both;white-space:nowrap;z-index:3}

/* 18 */
.catC{position:absolute;width:56px;height:44px;border-radius:46% 46% 40% 40%;
  background:#FFFDF9;border:2px solid var(--ob);left:50%;margin-left:-28px;
  top:50%;margin-top:-22px;opacity:0;
  animation:kCatRoll 1.9s cubic-bezier(.2,.9,.3,1) both}
.ct-ear{position:absolute;top:-10px;left:8px;display:flex;gap:22px}
.ct-ear i{width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
  border-bottom:12px solid var(--ob);display:block}
.ct-eye{position:absolute;top:15px;left:14px;display:flex;gap:16px;z-index:2}
.ct-eye i{width:5px;height:6px;border-radius:50%;background:var(--ob);display:block;
  animation:kBlink 1.2s .6s}
.ct-nose{position:absolute;top:25px;left:50%;margin-left:-2.5px;width:5px;height:3.5px;
  border-radius:50%;background:var(--ob);z-index:2}
.heartC{position:absolute;opacity:0;line-height:1;animation:kFloatUp 1.1s ease-out both}
.catT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.08em;opacity:0;animation:kRise .7s both;white-space:nowrap;z-index:3}

/* 19 */
.floodC{position:absolute;left:0;right:0;bottom:0;height:0;opacity:0;
  background:linear-gradient(0deg,rgba(192,57,43,.52) 0%,rgba(192,57,43,.16) 54%,transparent 100%);
  animation:kFlood2 1.1s cubic-bezier(.3,.7,.3,1) both}
.cloudC{position:absolute;border:1.5px solid;border-radius:50% 50% 46% 54%;opacity:0;
  transform:translate(-50%,-50%);
  animation:kCloudIn 1.5s cubic-bezier(.2,.8,.3,1) both;
  box-shadow:inset 0 0 18px rgba(224,177,92,.1)}
.sealS{position:absolute;width:44px;height:44px;display:grid;place-items:center;
  color:#F5EBE0;font-family:"Songti SC",serif;font-size:12px;font-weight:400;
  letter-spacing:.06em;border-radius:3px;opacity:0;
  animation:kStamp2 .5s cubic-bezier(.2,1.3,.4,1) both}
.cloudT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.34em;opacity:0;animation:kFade .6s both;white-space:nowrap;z-index:4}

/* 20 */
.pageF{position:absolute;inset:0;transform-origin:0 50%;opacity:0;
  backface-visibility:hidden;
  background:
    repeating-linear-gradient(180deg,transparent 0 21px,rgba(124,140,160,.14) 21px 22px),
    linear-gradient(90deg,rgba(255,253,249,.94),rgba(252,248,240,.82));
  box-shadow:-16px 0 30px rgba(51,56,61,.14);
  animation:kFlip2 1.15s cubic-bezier(.42,.06,.32,1) both}
.pageS{position:absolute;inset:0;opacity:0;
  background:linear-gradient(270deg,rgba(51,56,61,.16),transparent 60%);
  animation:kFade .5s both;z-index:2}
.lightL{position:absolute;left:0;right:0;bottom:0;height:70%;opacity:0;
  background:radial-gradient(ellipse at 50% 100%,var(--c),transparent 66%);
  animation:kBreath 1.4s .5s both}
.dustP{position:absolute;width:2px;height:2px;border-radius:50%;opacity:0;
  animation:kFloatUp 1.4s ease-out both}
.pageT{position:absolute;font-family:"Songti SC",serif;font-size:11px;font-weight:400;
  letter-spacing:.12em;opacity:0;animation:kRise .8s both;white-space:nowrap;z-index:4}

/* 21 */
.petalP{position:absolute;width:12px;height:9px;border-radius:50% 0 50% 0;opacity:0;
  animation:kDrift 1.3s cubic-bezier(.3,.1,.5,1) both}
.lipP{position:absolute;width:52px;height:26px;opacity:0;
  animation:kPop .42s cubic-bezier(.2,1.5,.4,1) both}
.lipP i{position:absolute;display:block;background:var(--c)}
/* 上唇：两个唇峰 + 深人中 */
.lipP i:nth-child(1){left:0;top:0;width:26px;height:15px;
  border-radius:52% 50% 8% 62%/72% 78% 22% 38%}
.lipP i:nth-child(2){right:0;top:0;width:26px;height:15px;
  border-radius:50% 52% 62% 8%/78% 72% 38% 22%}
/* 下唇：一整片 */
.lipP i:nth-child(3){left:2px;top:11px;width:48px;height:15px;
  border-radius:44% 44% 50% 50%/24% 24% 76% 76%}
/* 唇缝的高光，让它一眼是嘴 */
.lipP i:nth-child(4){left:6px;top:12px;width:40px;height:2px;border-radius:2px;
  background:rgba(255,255,255,.55)}
.loveT{position:absolute;font-family:Georgia,"Songti SC",serif;font-size:14px;font-style:italic;
  font-weight:400;opacity:0;animation:kPop .5s cubic-bezier(.2,1.3,.4,1) both;z-index:4;
  white-space:nowrap}

/* ══ 全屏层向外延伸：铺满整屏而不是只铺设计稿的 548 ══ */
.fxF,.glowB,.veil,.halftone,.pageF,.pageS,.sweepB,.gustW{
  top:calc(-1 * var(--bleed,0px))!important;
  bottom:calc(-1 * var(--bleed,0px))!important}
/* 贴底的渐变层：底边下移一个 bleed，高度同步加回去，视觉比例不变 */
.lightL{bottom:calc(-1 * var(--bleed,0px))!important;
  height:calc(70% + var(--bleed,0px))!important}
.mountI{bottom:calc(-1 * var(--bleed,0px))!important;
  height:calc(30% + var(--bleed,0px))!important}
/* floodC 的高度由 kFlood2 动画控制，只把底边下移，让它从真实屏底涌起 */
.floodC{bottom:calc(-1 * var(--bleed,0px))!important}
/* loveT 用位移锚定居中，不能被 kPop 的 transform 覆盖 */
.loveT{animation-name:kPopC!important}
@keyframes kPopC{0%{opacity:0;transform:translateX(-50%) scale(.15)}
 58%{opacity:1;transform:translateX(-50%) scale(1.15)}
 100%{opacity:1;transform:translateX(-50%) scale(1)}}
/* 薄纱专用：与 kBreath 同节奏，峰值从 .8 降到 .42 */
@keyframes kBreathVeil{0%{opacity:0;transform:scale(.86)}
 50%{opacity:.42;transform:scale(1.03)}100%{opacity:.32;transform:scale(1)}}
/* ══════════════════════════════════════════════════════════
   屏幕震动语汇（v4 · 顶格猛版）
   位移峰值 19–47px。设计稿实测四方向余量 67.7px，所以不会撑破布局。
   加狠的三个抓手：① 位移放大 ② 冲击段缩短 ③ 冲击后补高频余震。
   力度按主题物理性格分档：硬边类 30px 上下带余震；印刷类方形顿挫不余震；
   柔和类幅度给足但走圆；生活类有明确方向性。
   注意：旋转按对角半径放大边角位移，所以带旋转的震法旋转量控制在 2° 以内，
        力度主要靠平移传达。

   ── 与设计稿的唯一差别 ──
   设计稿动的是 .phone（312×548 的手机壳）；真实前端没有手机壳，
   内容散在 .app 与 position:fixed 的 fxLayer / tabbar 里。
   所以这里动的是 <html>：fixed 层会跟着一起平移，才是「整块屏幕被推」。
   已实测：scrollWidth 不变、不撑出滚动条、根背景传播到画布所以不会露白边。
   ══════════════════════════════════════════════════════════ */
/* 砸击：抬 9 → 砸到底 19 → 大幅反弹 → 五段衰减 → 高频余震（01 印章，全场最猛）
   余震段用 4% 一格的密排，视觉上是被砸完还在嗡嗡抖 */
@keyframes shkSlam{0%,100%{transform:translate(0,0) rotate(0) scale(1,1)}
  8%{transform:translate(0,-12px) rotate(0) scale(.996,1.006)}
  14%{transform:translate(0,25px) rotate(.35deg) scale(1.012,.978)}
  21%{transform:translate(-39px,-15px) rotate(-.55deg) scale(.99,1.014)}
  29%{transform:translate(34px,11px) rotate(.5deg) scale(1.006,.994)}
  38%{transform:translate(-25px,-8px) rotate(-.38deg)}
  47%{transform:translate(19px,7px) rotate(.28deg)}
  56%{transform:translate(-13px,-4px) rotate(-.18deg)}
  63%{transform:translate(8px,4px) rotate(.1deg)}
  68%{transform:translate(-5px,-3px) rotate(-.05deg)}
  72%{transform:translate(4px,3px)}
  76%{transform:translate(-4px,-1px)}
  80%{transform:translate(3px,1px)}
  84%{transform:translate(-3px,-1px)}
  88%{transform:translate(1px,1px)}
  92%{transform:translate(-1px,0)}}

/* 乱抖：高频、无规律、多轴，越抖越散（02 涂鸦） */
@keyframes shkRattle{0%,100%{transform:translate(0,0) rotate(0)}
  7%{transform:translate(-24px,16px) rotate(-.8deg)}
  14%{transform:translate(27px,-19px) rotate(.85deg)}
  21%{transform:translate(-23px,-21px) rotate(.5deg)}
  28%{transform:translate(24px,20px) rotate(-.7deg)}
  36%{transform:translate(-25px,13px) rotate(.8deg)}
  44%{transform:translate(20px,-16px) rotate(-.6deg)}
  52%{transform:translate(-16px,19px) rotate(.45deg)}
  60%{transform:translate(15px,-12px) rotate(-.4deg)}
  68%{transform:translate(-11px,9px) rotate(.28deg)}
  76%{transform:translate(8px,-7px) rotate(-.2deg)}
  84%{transform:translate(-5px,4px) rotate(.12deg)}
  92%{transform:translate(3px,-3px)}}

/* 顿：直上直下的硬着陆，压扁更明显（03 贴纸） */
@keyframes shkTap{0%,100%{transform:translateY(0) scale(1,1)}
  20%{transform:translateY(27px) scale(1.018,.97)}
  42%{transform:translateY(-15px) scale(.992,1.01)}
  58%{transform:translateY(9px) scale(1.006,.995)}
  70%{transform:translateY(-5px)}
  80%{transform:translateY(4px)}
  90%{transform:translateY(-1px)}}

/* 走纸错位：只有横向，带斜切（04 老电视/传真机） */
@keyframes shkCrt{0%,100%{transform:translateX(0) skewX(0)}
  12%{transform:translateX(-29px) skewX(1.7deg)}
  26%{transform:translateX(25px) skewX(-1.4deg)}
  42%{transform:translateX(-20px) skewX(1deg)}
  58%{transform:translateX(15px) skewX(-.65deg)}
  72%{transform:translateX(-9px) skewX(.35deg)}
  86%{transform:translateX(5px) skewX(-.15deg)}}

/* 上浮：被托起 28px 再落下，落底轻过冲（05 星月）
   慢不等于弱：幅度必须够，时长短于 1.2s 否则眼睛会当成没动 */
@keyframes shkFloatUp{0%,100%{transform:translateY(0) scale(1)}
  12%{transform:translateY(8px) scale(.994)}
  34%{transform:translateY(-32px) scale(1.02)}
  52%{transform:translateY(-38px) scale(1.024)}
  70%{transform:translateY(-12px) scale(1.008)}
  84%{transform:translateY(7px) scale(.995)}
  93%{transform:translateY(-3px) scale(1.001)}}

/* 心跳：两次收放都比上一版重，第二次明显更轻（06 甜心） */
@keyframes shkBeat{0%,100%{transform:scale(1) translateY(0)}
  10%{transform:scale(1.05) translateY(-21px)}
  22%{transform:scale(1) translateY(0)}
  34%{transform:scale(1.032) translateY(-13px)}
  46%{transform:scale(1) translateY(0)}
  60%{transform:scale(1.014) translateY(5px)}
  74%{transform:scale(1.005) translateY(-1px)}}

/* 斜推：严格沿 -45° 推，和斜切条同向（07 东京） */
@keyframes shkSlash{0%,100%{transform:translate(0,0)}
  18%{transform:translate(-33px,34px)}
  40%{transform:translate(25px,-25px)}
  60%{transform:translate(-17px,17px)}
  78%{transform:translate(11px,-11px)}
  90%{transform:translate(-4px,4px)}}

/* 罗盘：旋转 2° + 斜向漂移，像指针找北时整块先歪再摆正（08 星盘） */
@keyframes shkSpin{0%,100%{transform:rotate(0) translate(0,0)}
  22%{transform:rotate(2deg) translate(17px,-15px)}
  46%{transform:rotate(-1.85deg) translate(-15px,15px)}
  66%{transform:rotate(1.1deg) translate(8px,-7px)}
  84%{transform:rotate(-.45deg) translate(3px,-3px)}}

/* 生长：向上顶，纵向拉伸（09 藤蔓） */
@keyframes shkRise{0%,100%{transform:translateY(0) scaleY(1)}
  26%{transform:translateY(-31px) scaleY(1.019)}
  52%{transform:translateY(-19px) scaleY(1.01)}
  72%{transform:translateY(7px) scaleY(.995)}
  86%{transform:translateY(-3px) scaleY(1.001)}}

/* 涂抹：纯横向来回，四程衰减（10 马克笔） */
@keyframes shkSwipe{0%,100%{transform:translateX(0)}
  12%{transform:translateX(32px)}
  28%{transform:translateX(-32px)}
  44%{transform:translateX(24px)}
  60%{transform:translateX(-16px)}
  76%{transform:translateX(8px)}
  88%{transform:translateX(-3px)}}

/* 弹跳：两次向上蹦，落地压扁（11 糖果 / 18 软糖） */
@keyframes shkHop{0%,100%{transform:translateY(0) scale(1,1)}
  12%{transform:translateY(-36px) scale(.976,1.03)}
  26%{transform:translateY(11px) scale(1.024,.97)}
  42%{transform:translateY(-20px) scale(.988,1.012)}
  56%{transform:translateY(5px) scale(1.011,.991)}
  70%{transform:translateY(-7px) scale(.997,1.002)}
  84%{transform:translateY(3px) scale(1.002,1)}}

/* 甩：左右大幅摇摆带旋转，幅度接近上限（12 漫画） */
@keyframes shkWobble{0%,100%{transform:translateX(0) rotate(0)}
  10%{transform:translateX(-32px) rotate(-1.7deg)}
  24%{transform:translateX(32px) rotate(1.7deg)}
  38%{transform:translateX(-24px) rotate(-1.3deg)}
  52%{transform:translateX(19px) rotate(1deg)}
  66%{transform:translateX(-12px) rotate(-.65deg)}
  80%{transform:translateX(7px) rotate(.35deg)}
  91%{transform:translateX(-3px) rotate(-.1deg)}}

/* 压纸：向下沉一下再浮起，压得比上一版实（13 笔尖压纸） */
@keyframes shkPress{0%,100%{transform:translateY(0) scale(1)}
  22%{transform:translateY(20px) scale(.989)}
  46%{transform:translateY(12px) scale(.994)}
  66%{transform:translateY(-5px) scale(1.002)}
  82%{transform:translateY(3px) scale(1)}}

/* 沉降：往下沉 14px 再落定，仍是全套最轻的一档（14 极简） */
@keyframes shkSettle{0%,100%{transform:translateY(0)}
  34%{transform:translateY(19px)}
  62%{transform:translateY(12px)}
  82%{transform:translateY(4px)}}

/* 水晃：左右倾斜，像容器里的水被撞了一下（15 水彩） */
@keyframes shkSway{0%,100%{transform:rotate(0) translateX(0)}
  20%{transform:rotate(1.5deg) translateX(19px)}
  44%{transform:rotate(-1.35deg) translateX(-19px)}
  66%{transform:rotate(.8deg) translateX(11px)}
  84%{transform:rotate(-.3deg) translateX(-4px)}}

/* 洇开：向四周胀 + 上提，像墨落纸被压了一下（16 水墨） */
@keyframes shkBloom{0%,100%{transform:scale(1) translateY(0)}
  24%{transform:scale(1.038) translateY(-16px)}
  50%{transform:scale(1.025) translateY(-11px)}
  74%{transform:scale(1.01) translateY(4px)}
  88%{transform:scale(1.004) translateY(-1px)}}

/* 吹偏：被风从左边推一下再松手（17 麦浪） */
@keyframes shkGust{0%,100%{transform:translateX(0) skewX(0)}
  20%{transform:translateX(32px) skewX(-2deg)}
  44%{transform:translateX(15px) skewX(-1deg)}
  66%{transform:translateX(-11px) skewX(.6deg)}
  84%{transform:translateX(4px) skewX(-.2deg)}}

/* 翻页：3D 转 + 被书页带动的横向甩（20 书页）
   纯 rotateX 只压缩高度、边角位移极小，必须叠横向位移才看得见 */
@keyframes shkPage{0%,100%{transform:perspective(900px) rotateX(0) translateX(0) translateY(0)}
  15%{transform:perspective(900px) rotateX(4.4deg) translateX(-21px) translateY(-11px)}
  36%{transform:perspective(900px) rotateX(2.2deg) translateX(25px) translateY(-3px)}
  58%{transform:perspective(900px) rotateX(-1.8deg) translateX(-15px) translateY(4px)}
  78%{transform:perspective(900px) rotateX(.7deg) translateX(5px) translateY(0)}}

/* 亲一下：先压下去再回弹，带一点点歪（21 唇印） */
@keyframes shkKiss{0%,100%{transform:translateY(0) scale(1) rotate(0)}
  24%{transform:translateY(20px) scale(1.02,.978) rotate(-.7deg)}
  48%{transform:translateY(-8px) scale(.994,1.008) rotate(.35deg)}
  68%{transform:translateY(4px) scale(1.002,.999)}
  84%{transform:translateY(-1px) scale(1)}}

/* 云开：外扩 + 上浮与微旋（19 云纹） */
@keyframes shkCloud{0%,100%{transform:scale(1) rotate(0) translateY(0)}
  28%{transform:scale(1.04) rotate(1.4deg) translateY(-21px)}
  56%{transform:scale(1.026) rotate(-.85deg) translateY(-15px)}
  80%{transform:scale(1.008) rotate(.3deg) translateY(4px)}}

/* 呼噜：左右蹭，像猫在腿上翻身（18 猫咪备用） */
@keyframes shkPurr{0%,100%{transform:translateX(0) rotate(0)}
  18%{transform:translateX(-9px) rotate(-1.1deg)}
  38%{transform:translateX(9px) rotate(1.1deg)}
  56%{transform:translateX(-7px) rotate(-.8deg)}
  74%{transform:translateX(4px) rotate(.5deg)}
  88%{transform:translateX(-3px) rotate(-.2deg)}}



/* ── 唯一入口：给根元素挂哪一条由主题决定 ── */
html.ph-shk{animation-name:var(--shk);
  animation-duration:var(--shkd,.5s);
  animation-timing-function:var(--shke,linear);
  animation-fill-mode:both;
  will-change:transform}

/* ══════════════════════════════════════════════════════════
   画面级冲击层（v5）
   震动让「整块屏幕位移」，这一层让「画面本身被打了一下」。
   两者的区别：位移是被人推了一把，冲击是挨了一拳。
   语汇全部是镜头语言：闪光 / 冲击波 / 玻璃裂纹 / 撕裂 / 色差 / 速度线
   / 镜头推近 / 暗角收紧 / 扫描线 / 光扫 / 爆炸星 / 墨爆。
   全部画在 fxStage 里，随 clear(fx) 一起回收，不留残留。
   ══════════════════════════════════════════════════════════ */
.imp{position:absolute;inset:0;pointer-events:none}

/* 爆白：只有「打到的那一下」该白，之后立刻让位给内容。
   这里踩过两次坑：
     ① 峰值维持太久 → 整屏糊成一片，看不到砸下来的印章
     ② 衰减停在 .3   → 留一层灰雾，浅色主题尤其脏
   所以曲线是：2% 冲到峰值 → 4% 腰斩 → 8% 只剩一成半 → 14% 归零。
   全程压在 40ms 内（dur 260ms × 0.14），一眨眼就过去，但绝对看得见。 */
.impFlash{position:absolute;inset:0;background:var(--c,#fff);opacity:0;
  animation:impFlash var(--d,.26s) linear var(--dl,0ms) both}
@keyframes impFlash{0%{opacity:0}
  2%{opacity:var(--a,.9)}
  4%{opacity:calc(var(--a,.9) * .42)}
  8%{opacity:calc(var(--a,.9) * .14)}
  14%{opacity:0}
  100%{opacity:0}}

/* 冲击波：从冲击点向外炸，边越走越细，收到 1px 才不显得像描边圆 */
.impRing{position:absolute;left:var(--x,50%);top:var(--y,48%);
  width:var(--w,300px);height:var(--hh,var(--w,300px));border-radius:var(--rd,50%);
  border:var(--bw,10px) solid var(--c,#fff);opacity:0;
  transform:translate(-50%,-50%) scale(.08);
  animation:impRing var(--d,.72s) cubic-bezier(.16,.85,.3,1) var(--dl,0ms) both}
@keyframes impRing{
  0%{transform:translate(-50%,-50%) scale(.08);opacity:0;border-width:var(--bw,10px)}
  6%{opacity:.95}
  55%{opacity:.42;border-width:calc(var(--bw,10px) * .28)}
  100%{transform:translate(-50%,-50%) scale(1);opacity:0;border-width:1px}}

/* 玻璃裂纹：整块淡入，线条在冲击瞬间最亮，之后随碎片一起隐去 */
.impCrack{position:absolute;inset:0;width:100%;height:100%;opacity:0;
  overflow:visible;animation:impCrack var(--d,1200ms) ease-out var(--dl,0ms) both}
@keyframes impCrack{0%{opacity:0}3%{opacity:1}52%{opacity:.82}100%{opacity:0}}

/* 撕裂：横向条带整体错位，像信号被打断。steps 让它一格一格跳，不做平滑 */
.impTear{position:absolute;left:-10%;right:-10%;height:var(--h,14px);top:var(--y,50%);
  background:var(--c,#fff);opacity:0;
  animation:impTear var(--d,.5s) steps(1,end) var(--dl,0ms) both}
@keyframes impTear{
  0%{opacity:0;transform:translateX(0)}
  8%{opacity:var(--a,.85);transform:translateX(var(--dx,20px))}
  30%{opacity:var(--a,.85);transform:translateX(calc(var(--dx,20px) * -.55))}
  55%{opacity:calc(var(--a,.85) * .55);transform:translateX(calc(var(--dx,20px) * .3))}
  82%{opacity:0;transform:translateX(0)}}

/* 色差：红/青双影从两侧拉开，模拟镜头被撞后三个通道没对齐。
   坑：默认 height:100% + 左右各外扩 8%，等于给整屏盖了一层红青光，
   浅底会立刻变脏、深底会变青灰。必须默认收成一条窄带（28%），
   要整屏色差就在个别主题里显式给 h:100。 */
.impRgb{position:absolute;left:-8%;right:-8%;height:var(--h,28%);top:var(--y,36%);
  opacity:0;background:linear-gradient(90deg,var(--c1,#ff2d55) 0%,transparent 30%,
    transparent 70%,var(--c2,#25f4ee) 100%);
  animation:impRgb var(--d,.42s) ease-out var(--dl,0ms) both}
@keyframes impRgb{0%{opacity:0;transform:translateX(0)}
  10%{opacity:var(--a,.7);transform:translateX(var(--dx,14px))}
  45%{opacity:calc(var(--a,.7) * .55);transform:translateX(calc(var(--dx,14px) * -.7))}
  100%{opacity:0;transform:translateX(0)}}

/* 速度线：从冲击点向外辐射，锚在中心点、绕底端旋转，才真的是"放射" */
.impSpeed{position:absolute;inset:0;opacity:0;
  animation:impSpeed var(--d,.52s) ease-out var(--dl,0ms) both}
.impSpeed i{position:absolute;left:var(--x,50%);top:var(--y,48%);width:var(--w,3px);
  height:var(--len,180px);background:linear-gradient(to top,var(--c,#fff),transparent);
  transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(var(--r,0deg));
  opacity:var(--o,.85)}
@keyframes impSpeed{0%{opacity:0}10%{opacity:1}100%{opacity:0}}

/* 镜头推：内容被顶得往里一缩再弹回。和位移是两回事，叠加才有纵深 */
#view-today.ph-punch,#view-review.ph-punch,#view-settings.ph-punch{animation:impPunch var(--pd,.5s) cubic-bezier(.2,.9,.25,1) var(--pdl,0ms) both}
@keyframes impPunch{0%{transform:scale(1)}7%{transform:scale(var(--pz,1.05))}
  38%{transform:scale(.997)}66%{transform:scale(1.003)}100%{transform:scale(1)}}

/* 柔焦脉冲：梦境/水彩用。
   坑：整屏 blur 开到 3px 就把正文糊成一片，看不清内容就是失败的动效。
   所以上限压到 1.6px 左右、并且在 45% 之前就回到 0——
   观感是「镜头对焦抖了一下」，不是「眼睛花了」。
   中间的字必须始终可读，柔可以，瞎不行。 */
#view-today.ph-blur,#view-review.ph-blur,#view-settings.ph-blur{animation:impBlur var(--bd,.9s) ease-out var(--bdl,0ms) both}
@keyframes impBlur{0%{filter:blur(0)}
  12%{filter:blur(var(--bl,1.4px))}
  40%{filter:blur(calc(var(--bl,1.4px) * .34))}
  68%{filter:blur(0)}
  100%{filter:blur(0)}}

/* 暗角：只压最外一圈，把视线挤向中心。
   坑：透明区给 30% 会把整屏压灰，浅色主题直接变脏。
   透明区必须拉到 58%，只让边缘 1/3 的环带变暗，中心永远是干净的。 */
.impVig{position:absolute;inset:0;opacity:0;
  background:radial-gradient(circle at var(--x,50%) var(--y,48%),transparent 58%,
    var(--c,rgba(0,0,0,.92)) 100%);
  animation:impVig var(--d,.62s) ease-out var(--dl,0ms) both}
@keyframes impVig{0%{opacity:0}7%{opacity:var(--a,.7)}
  40%{opacity:calc(var(--a,.7) * .5)}100%{opacity:0}}

/* 碎片：带旋转飞散，末端缩小到 1/4 才消失，不然像凭空蒸发 */
.impShard{position:absolute;left:var(--x,50%);top:var(--y,48%);width:var(--s,6px);
  height:var(--s,6px);background:var(--c,#fff);border-radius:var(--rd,1px);opacity:0;
  animation:impShard var(--d,.85s) cubic-bezier(.2,.7,.4,1) var(--dl,0ms) both}
@keyframes impShard{
  0%{opacity:0;transform:translate(-50%,-50%) rotate(0) scale(1)}
  8%{opacity:1}
  100%{opacity:0;transform:translate(calc(-50% + var(--dx,40px)),
    calc(-50% + var(--dy,40px))) rotate(var(--rot,180deg)) scale(.25)}}

/* 十字星闪：漫画式高光，旋转 45° 收尾 */
.impStar{position:absolute;left:var(--x,50%);top:var(--y,48%);
  width:var(--s,44px);height:var(--s,44px);opacity:0;
  animation:impStar var(--d,.6s) cubic-bezier(.2,.9,.3,1) var(--dl,0ms) both}
.impStar::before,.impStar::after{content:"";position:absolute;left:50%;top:50%;
  background:var(--c,#fff);transform:translate(-50%,-50%)}
.impStar::before{width:100%;height:2px}
.impStar::after{width:2px;height:100%}
@keyframes impStar{0%{opacity:0;transform:translate(-50%,-50%) scale(.15) rotate(0)}
  14%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}
  100%{opacity:0;transform:translate(-50%,-50%) scale(1.7) rotate(45deg)}}

/* 扫描线：一道亮带从上扫到底（CRT / 传真机 / 走纸） */
.impScan{position:absolute;left:0;right:0;height:var(--h,26%);top:0;opacity:0;
  background:linear-gradient(to bottom,transparent,var(--c,rgba(255,255,255,.7)),transparent);
  animation:impScan var(--d,.52s) linear var(--dl,0ms) both}
@keyframes impScan{0%{opacity:0;transform:translateY(-110%)}
  10%{opacity:1}88%{opacity:.6}100%{opacity:0;transform:translateY(430%)}}

/* 光扫：斜向高光掠过，纸面/玻璃反光。
   坑：浅色主题（s20 米白、s09 浅绿、s14 暖白）底色本来就亮，
   再叠一层白色高光直接过曝成一片白纸。所以强度默认压到 .34，
   高光色改成半透明白，靠"掠过"的动作感取胜，不靠亮度。 */
.impSweep{position:absolute;inset:-20%;opacity:0;
  background:linear-gradient(105deg,transparent 38%,var(--c,rgba(255,255,255,.55)) 50%,
    transparent 62%);
  animation:impSweep var(--d,.72s) cubic-bezier(.3,.7,.3,1) var(--dl,0ms) both}
@keyframes impSweep{0%{opacity:0;transform:translateX(-70%)}
  16%{opacity:var(--a,.34)}100%{opacity:0;transform:translateX(70%)}}

/* 斜带：沿斜向擦过，东京/斜切类专用 */
.impDiag{position:absolute;left:-30%;right:-30%;height:var(--h,40px);top:var(--y,40%);
  background:var(--c,#fff);opacity:0;
  animation:impDiag var(--d,.5s) cubic-bezier(.3,.8,.3,1) var(--dl,0ms) both}
@keyframes impDiag{0%{opacity:0;transform:skewX(-24deg) translateX(-72%)}
  14%{opacity:var(--a,.85)}100%{opacity:0;transform:skewX(-24deg) translateX(72%)}}

/* 墨爆：中心留空，只让边缘那圈颜料铺开，正文不被盖住 */
.impInk{position:absolute;left:var(--x,50%);top:var(--y,46%);
  width:var(--s,240px);height:var(--s,240px);opacity:0;
  background:radial-gradient(circle,transparent 40%,var(--c,#111) 60%,transparent 82%);
  border-radius:46% 54% 41% 59%/55% 43% 57% 45%;
  animation:impInk var(--d,1s) cubic-bezier(.15,.8,.3,1) var(--dl,0ms) both}
@keyframes impInk{0%{opacity:0;transform:translate(-50%,-50%) scale(.12) rotate(0)}
  12%{opacity:var(--a,.5)}
  100%{opacity:0;transform:translate(-50%,-50%) scale(1.55) rotate(38deg)}}

/* 爆炸星：漫画式锯齿团。必须中心镂空——实心铺满会把正文全盖掉，
   锯齿只在外圈「咬」进画面，中间留给内容，这是它不脏的关键。
   用 mask 挖掉中心 42%，锯齿形状仍然完整。 */
.impBurst{position:absolute;left:var(--x,50%);top:var(--y,44%);
  width:var(--s,300px);height:var(--s,300px);opacity:0;background:var(--c,#fff);
  clip-path:polygon(50% 0%,58% 30%,78% 8%,76% 36%,100% 34%,78% 52%,96% 72%,68% 68%,
    70% 100%,50% 74%,32% 100%,32% 70%,4% 74%,22% 52%,0% 34%,24% 36%,22% 8%,42% 30%);
  -webkit-mask-image:radial-gradient(circle at 50% 50%,transparent 54%,#000 66%);
  mask-image:radial-gradient(circle at 50% 50%,transparent 54%,#000 66%);
  animation:impBurst var(--d,.6s) cubic-bezier(.15,.85,.3,1) var(--dl,0ms) both}
@keyframes impBurst{0%{opacity:0;transform:translate(-50%,-50%) scale(.2) rotate(0)}
  12%{opacity:var(--a,.92)}
  100%{opacity:0;transform:translate(-50%,-50%) scale(1.5) rotate(var(--rot,18deg))}}

/* 柔光：一团向外化开的亮，梦境/水彩/国风的底子 */
.impGlow{position:absolute;left:var(--x,50%);top:var(--y,44%);
  width:var(--s,320px);height:var(--s,320px);border-radius:50%;opacity:0;
  background:radial-gradient(circle,var(--c,rgba(255,255,255,.9)) 0%,transparent 68%);
  animation:impGlow var(--d,1.4s) cubic-bezier(.2,.8,.3,1) var(--dl,0ms) both}
@keyframes impGlow{0%{opacity:0;transform:translate(-50%,-50%) scale(.25)}
  16%{opacity:var(--a,.85)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}}
`;

var styleEl = document.createElement('style');
styleEl.id = 'fxcss';
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

function box(fx){
  var d=document.createElement('div');
  d.className='fxm';
  fx.appendChild(d);
  return d;
}
function put(parent,cls,style,text,tag){
  var d=document.createElement(tag||'div');
  if(cls) d.className=cls;
  if(style) d.style.cssText=style;
  if(text!=null) d.textContent=text;
  parent.appendChild(d);
  return d;
}
function clear(fx){ fx.innerHTML=''; }

/* ══════════════════════════════════════════════════════════
   画面级冲击层 · 基元
   全部只往 .fx 里塞绝对定位的层，随 clear(fx) 一起回收。
   参数统一用短名：c 色 / a 强度 / d 时长 / dl 延迟
   ══════════════════════════════════════════════════════════ */
function iFlash(fx,c,a,d,dl){
  put(fx,'impFlash','--c:'+c+';--a:'+a+';--d:'+d+'ms;--dl:'+(dl||0)+'ms');
}
function iRing(fx,c,o){
  o=o||{};
  put(fx,'impRing','--c:'+c+';--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?46:o.y)+'%;'
    +'--w:'+(o.w||300)+'px;--hh:'+(o.h||o.w||300)+'px;--bw:'+(o.bw||10)+'px;'
    +'--rd:'+(o.rd||'50%')+';--d:'+(o.d||760)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iSpeed(fx,c,o){
  o=o||{};
  var n=o.n||14;
  var b=put(fx,'impSpeed','--d:'+(o.d||560)+'ms;--dl:'+(o.dl||0)+'ms');
  for(var i=0;i<n;i++){
    put(b,'','--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?46:o.y)+'%;'
      +'--r:'+(i*360/n+R()*10-5).toFixed(1)+'deg;'
      +'--len:'+((o.len||170)+R()*(o.len2||90)).toFixed(0)+'px;'
      +'--w:'+((o.w||2.4)+R()*1.4).toFixed(1)+'px;'
      +'--c:'+c+';--o:'+(.4+R()*.55).toFixed(2),null,'i');
  }
}
function iShard(fx,cols,o){
  o=o||{};
  var n=o.n||14;
  for(var i=0;i<n;i++){
    var a=R()*360, d=(o.r1||50)+R()*(o.r2||150);
    put(fx,'impShard','--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?46:o.y)+'%;'
      +'--s:'+((o.s||5)+R()*(o.s2||6)).toFixed(1)+'px;--c:'+cols[i%cols.length]
      +';--dx:'+(Math.cos(a*DEG)*d).toFixed(1)+'px;--dy:'+(Math.sin(a*DEG)*d).toFixed(1)+'px;'
      +'--rot:'+(R()*720-360).toFixed(0)+'deg;--rd:'+(R()>.5?'50%':'1px')
      +';--d:'+((o.d||820)+R()*220).toFixed(0)+'ms;--dl:'+(o.dl||0)+'ms');
  }
}
function iTear(fx,c,o){
  o=o||{};
  put(fx,'impTear','--c:'+c+';--y:'+(o.y||50)+'%;--h:'+(o.h||12)+'px;'
    +'--dx:'+(o.dx||22)+'px;--a:'+(o.a||.8)+';--d:'+(o.d||520)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iTears(fx,c,n,dl){
  for(var i=0;i<n;i++)
    iTear(fx,c,{y:(10+R()*78).toFixed(1),h:(6+R()*18).toFixed(0),
      dx:(R()*40-20).toFixed(0),a:(.38+R()*.5).toFixed(2),
      d:400+R()*280,dl:(dl||0)+R()*180});
}
function iRgb(fx,c1,c2,o){
  o=o||{};
  /* 默认只染一条 28% 高的窄带、落在 36% 处：
     给 100% 会整屏盖一层红青，内容直接看不见，这是踩过的坑 */
  put(fx,'impRgb','--c1:'+c1+';--c2:'+c2+';--y:'+(o.y==null?36:o.y)+'%;'
    +'--h:'+(o.h||28)+'%;'
    +'--dx:'+(o.dx||16)+'px;--a:'+(o.a||.65)+';--d:'+(o.d||460)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iVig(fx,c,o){
  o=o||{};
  put(fx,'impVig','--c:'+c+';--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?46:o.y)+'%;'
    +'--a:'+(o.a||.6)+';--d:'+(o.d||700)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iStar(fx,c,o){
  o=o||{};
  put(fx,'impStar','--c:'+c+';--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?44:o.y)+'%;'
    +'--s:'+(o.s||44)+'px;--d:'+(o.d||600)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iScan(fx,c,o){
  o=o||{};
  put(fx,'impScan','--c:'+c+';--h:'+(o.h||26)+'%;--d:'+(o.d||540)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iSweep(fx,c,o){
  o=o||{};
  put(fx,'impSweep','--c:'+c+';--a:'+(o.a||.75)+';--d:'+(o.d||720)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iDiag(fx,c,o){
  o=o||{};
  put(fx,'impDiag','--c:'+c+';--y:'+(o.y||40)+'%;--h:'+(o.h||40)+'px;'
    +'--a:'+(o.a||.85)+';--d:'+(o.d||500)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iInk(fx,c,o){
  o=o||{};
  put(fx,'impInk','--c:'+c+';--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?46:o.y)+'%;'
    +'--s:'+(o.s||240)+'px;--a:'+(o.a||.5)+';--d:'+(o.d||1000)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iBurst(fx,c,o){
  o=o||{};
  put(fx,'impBurst','--c:'+c+';--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?44:o.y)+'%;'
    +'--s:'+(o.s||300)+'px;--a:'+(o.a||.92)+';--rot:'+(o.rot||18)+'deg;'
    +'--d:'+(o.d||600)+'ms;--dl:'+(o.dl||0)+'ms');
}
function iGlow(fx,c,o){
  o=o||{};
  put(fx,'impGlow','--c:'+c+';--x:'+(o.x==null?50:o.x)+'%;--y:'+(o.y==null?44:o.y)+'%;'
    +'--s:'+(o.s||320)+'px;--a:'+(o.a||.85)+';--d:'+(o.d||1400)+'ms;--dl:'+(o.dl||0)+'ms');
}
/* 玻璃裂纹：从冲击点向外放射，主裂线带分叉，宽细双层叠出玻璃折光 */
function iCrack(fx,c,o){
  o=o||{};
  var NS='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('class','impCrack');
  /* viewBox 高度要跟随舞台实际高度：舞台会被 fit() 拉长到铺满屏，
     写死 548 时裂纹只裂上半截、下半截全是空白。CSS 的 .impCrack
     已是 inset:0 + 100%宽高，所以这里只改坐标系范围即可。 */
  svg.setAttribute('viewBox','0 0 312 '+stageH());
  svg.setAttribute('preserveAspectRatio','none');
  svg.style.cssText='--d:'+(o.d||1300)+'ms;--dl:'+(o.dl||0)+'ms';
  var cx=o.x==null?156:o.x, cy=o.y==null?stageH()*0.45:o.y;
  var n=o.n||8;
  function line(pts,w,op){
    var p=document.createElementNS(NS,'polyline');
    p.setAttribute('points',pts.map(function(q){
      return q[0].toFixed(1)+','+q[1].toFixed(1);
    }).join(' '));
    p.setAttribute('fill','none');
    p.setAttribute('stroke',c);
    p.setAttribute('stroke-width',w);
    p.setAttribute('stroke-opacity',op);
    p.setAttribute('stroke-linecap','round');
    p.setAttribute('stroke-linejoin','round');
    svg.appendChild(p);
  }
  for(var i=0;i<n;i++){
    var a=(i*360/n+R()*20-10)*DEG;
    var len=(o.len||120)+R()*(o.len2||130);
    var seg=3+((R()*3)|0), step=len/seg;
    var px=cx, py=cy, pts=[[cx,cy]], ang=a;
    for(var k=0;k<seg;k++){
      ang+=(R()*.7-.35);
      px+=Math.cos(ang)*step; py+=Math.sin(ang)*step;
      pts.push([px,py]);
    }
    line(pts,o.w||2.4,.22);
    line(pts,(o.w||2.4)*.45,.95);
    /* 分叉：从主裂线中段斜着岔出去，玻璃碎才有层次 */
    if(R()>.35){
      var m=pts[1+((R()*(pts.length-2))|0)];
      var ba=ang+(R()>.5?1:-1)*(.7+R()*.5);
      var bl=30+R()*70;
      line([m,[m[0]+Math.cos(ba)*bl,m[1]+Math.sin(ba)*bl]],(o.w||2.4)*.5,.8);
    }
  }
  fx.appendChild(svg);
}
/* 镜头推近 / 柔焦都作用在「正在显示的那一屏」。
   真实前端没有 .phone 手机壳，内容容器是 #view-today / #view-review / #view-settings，
   同一时刻只有一个可见（其余 hidden），所以取第一个非 hidden 的即可。 */
function viewOf(){
  var ids=['view-today','view-review','view-settings'];
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);
    if(el && !el.hidden) return el;
  }
  return null;
}
/* 真实控件 → 舞台设计坐标（312×548）。
   舞台是「按屏宽等比缩放的固定 548 高画布」：窗口比画布矮时 fit() 把 top 夹成 0，
   画布下半截溢出屏幕，这时写死 bottom:xxx 的层会跟着掉出可视区——
   实测 410×540 下 s21 唇印比「已掌握」进度条低 106px、More Love 整个跑出屏幕。
   而且 .view 是锁高的滚动容器，控件位置随滚动变，bottom 根本追不上。
   凡是要跟真实控件对齐的层，都按这里量到的坐标放，别写死。 */
function anchorOf(sel){
  if(!stage) return null;
  /* 关键：三屏都在 DOM 里，隐藏屏的元素 rect 全是 0。
     document.querySelector 可能命中隐藏屏里的同名元素（.pstat 在
     今日页和回顾页各有一个），量出来 top=0/h=0，算出的落点会跑到
     统计栏里面去（实测 s21 的 More Love 正好压在「近七天均值」上）。
     所以遍历所有匹配项，取第一个「有真实尺寸」的。 */
  var list=document.querySelectorAll(sel), el=null;
  for(var i=0;i<list.length;i++){
    var r=list[i].getBoundingClientRect();
    if(r.width||r.height){ el=list[i]; break; }
  }
  if(!el) return null;
  var sr=stage.getBoundingClientRect(), b=el.getBoundingClientRect();
  if(!sr.width) return null;
  var k=sr.width/312;
  return {l:(b.left-sr.left)/k, t:(b.top-sr.top)/k, w:b.width/k, h:b.height/k};
}
/* 舞台当前的设计稿高度。fit() 会把画布从 548 拉长到铺满屏，
   凡是要「覆盖整块画布」的矢量层（裂纹等）必须用这个值当坐标系高度，
   否则只画到 548 就断了。 */
function stageH(){
  if(!stage) return 548;
  var h=parseFloat(stage.style.height);
  return (h>0)? h : 548;
}
/* 底部文案统一落位：「贴在底部切换栏(tabbar)上沿之上」。
   【曾经的 bug】各套主题的底部文案写死 bottom:34px。设计稿里是
   bottom:88px（相对 548 画布），换成真机约 110px，本来就在 64px 的
   tabbar 上方。前端当年为了避开 tabbar 把它改小到 34px（≈42px 真机），
   结果反而躲进 tabbar 底下——More Love 等 14 套文案被整条遮住。
   现在按 tabbar 的真实顶边反算：bottom 是「距舞台底边的距离」，
   要落在 tabbar 顶边之上，就得 >= H - tabbarTop（再加一点留白）。 */
function bottomAboveTab(gapPx){
  var gap=(gapPx==null?12:gapPx);
  var tb=anchorOf('.tabbar');
  var H=stageH();
  if(tb && tb.h>0) return Math.max(8, Math.round((H-tb.t+gap)*10)/10);
  /* 拿不到 tabbar 时退回设计稿的 88（等价于原来的安全位置） */
  return 88;
}
/* 镜头推近：内容被顶得一缩，和整块位移是两回事，叠加才出纵深 */
function iPunch(t,o){
  o=o||{};
  var el=viewOf(); if(!el) return;
  var d=o.d||520, dl=o.dl||0;
  el.style.setProperty('--pd',d+'ms');
  el.style.setProperty('--pdl',dl+'ms');
  el.style.setProperty('--pz',o.z||1.045);
  el.classList.remove('ph-punch'); void el.offsetWidth; el.classList.add('ph-punch');
  clearTimeout(el._punT);
  el._punT=setTimeout(function(){el.classList.remove('ph-punch');},dl+d+60);
}
/* 柔焦脉冲：先糊一下再清，像眼睛没跟上 */
function iBlur(t,o){
  o=o||{};
  var el=viewOf(); if(!el) return;
  var d=o.d||900, dl=o.dl||0;
  el.style.setProperty('--bd',d+'ms');
  el.style.setProperty('--bdl',dl+'ms');
  el.style.setProperty('--bl',(o.bl||2.4)+'px');
  el.classList.remove('ph-blur'); void el.offsetWidth; el.classList.add('ph-blur');
  clearTimeout(el._bluT);
  el._bluT=setTimeout(function(){el.classList.remove('ph-blur');},dl+d+60);
}

/* ══════════════════════════════════════════════════════════
   21 套「镜头语言」配方
   原则：和主题原有的元素级动效不重复——
   元素动效演的是「发生了什么」，这一层演的是「镜头怎么挨的这一下」。
   ══════════════════════════════════════════════════════════ */
var IMP={
  /* 01 印章砸下 → 全套最重：爆白 + 玻璃裂 + 双冲击波 + 放射线 + 镜头推 + 碎片
     注意：s01 自带 .fx-scrim（0.42 黑幕），压暗已经够重了，
     这里再加暗角会把整屏压成灰板，所以暗角降到 .3 */
  s01:function(fx,t){
    var c=t.c;
    iFlash(fx,'#FFFFFF',.72,150,70);
    iCrack(fx,'rgba(255,255,255,.95)',{n:9,len:110,len2:150,d:1400,dl:78,x:156,y:250});
    iRing(fx,'#FFFFFF',{w:340,bw:14,d:780,dl:78});
    iRing(fx,c.ac,{w:250,bw:8,d:900,dl:138});
    iSpeed(fx,c.alt,{n:20,len:150,len2:110,d:560,dl:66});
    iPunch(t,{z:1.06,d:520,dl:60});
    iShard(fx,['#FFFFFF',c.ac,c.alt],{n:18,r1:60,r2:170,s:4,s2:7,dl:78});
    iStar(fx,'#FFFFFF',{s:56,dl:88});
    iVig(fx,'rgba(0,0,0,.9)',{a:.3,d:700,dl:66});
  },
  /* 02 涂鸦炸开 → 彩色爆炸星 + 满屏碎片 + 红青错位 */
  s02:function(fx,t){
    var c=t.c;
    iBurst(fx,'#F5C518',{s:330,dl:40,rot:24});
    iFlash(fx,'#FFFFFF',.66,190,30);
    iShard(fx,['#E0332B','#F5C518','#2E7DD1','#6BBF59',c.ac],{n:24,r1:40,r2:160,s:4,s2:8,dl:40});
    iRgb(fx,'#E0332B','#2E7DD1',{dx:20,a:.5,d:420,dl:30});
    iStar(fx,'#E0332B',{x:30,y:26,s:34,dl:60});
    iStar(fx,'#2E7DD1',{x:70,y:64,s:26,dl:110});
  },
  /* 03 贴纸啪上 → 硬闪 + 方形冲击波（贴纸是方的，波也得是方的） */
  s03:function(fx,t){
    var c=t.c;
    iFlash(fx,'#FFFFFF',.82,190,20);
    iRing(fx,'#FFFFFF',{w:320,h:250,bw:12,rd:'18px',d:620,dl:20});
    iRing(fx,c.ac,{w:230,h:180,bw:6,rd:'14px',d:720,dl:80});
    iStar(fx,'#FFFFFF',{s:48,dl:30});
    iPunch(t,{z:1.035,d:420,dl:10});
    iShard(fx,['#FFFFFF',c.ac,c.alt],{n:10,r1:40,r2:110,s:5,s2:6,dl:30});
  },
  /* 04 走纸错位 → 多层横向撕裂 + 红青错位 + 扫描带 */
  s04:function(fx,t){
    var c=t.c;
    iTears(fx,c.ink,6,0);
    iRgb(fx,'#FF3B30','#25F4EE',{dx:24,a:.6,d:520,dl:10});
    iScan(fx,'rgba(255,255,255,.75)',{h:22,d:560,dl:20});
    iFlash(fx,'#FFFFFF',.38,160,10);
    iVig(fx,'rgba(10,30,30,.9)',{a:.26,d:600,dl:20});
  },
  /* 05 柔光梦境 → 柔焦 + 一团慢慢化开的光 + 极淡的波（柔不等于弱，是慢而大）
     模糊只给 1.5px：再高正文就糊了，柔要柔在边缘不要柔在字上 */
  s05:function(fx,t){
    var c=t.c;
    iGlow(fx,c.ac,{s:420,a:.9,d:1500,dl:40});
    iBlur(t,{bl:1.5,d:1000,dl:60});
    iRing(fx,'#FFFFFF',{w:380,bw:14,d:1300,dl:60});
    iRing(fx,c.alt,{w:290,bw:8,d:1450,dl:140});
    iSweep(fx,'rgba(255,255,255,.85)',{a:.6,d:1100,dl:80});
    iStar(fx,'#FFFFFF',{x:50,y:20,s:30,dl:200});
  },
  /* 06 甜心 → 粉色心跳波，两次，第二下更轻 */
  s06:function(fx,t){
    var c=t.c;
    iFlash(fx,'#FFD9EC',.56,200,80);
    iRing(fx,'#FF8FC0',{w:300,bw:12,d:700,dl:80});
    iRing(fx,'#FF8FC0',{w:220,bw:7,d:640,dl:330});
    iGlow(fx,c.ac,{s:300,a:.7,d:1100,dl:60});
    iStar(fx,'#FFFFFF',{x:50,y:30,s:30,dl:120});
    iShard(fx,['#FF8FC0','#FFFFFF',c.alt],{n:12,r1:40,r2:120,s:4,s2:5,dl:100});
  },
  /* 07 东京 → 三道斜带依次擦过 + 错位 + 放射线，最"街头"的一套
     坑①：斜带给到 52px 高，扫过时整屏变绿看不到内容 → 收成 32/10/22px 细带
     坑②：iRgb 默认 h:100 会把整屏染青 → 已改成只染 28% 窄带
     白色那道要窄，它是"高光"不是"色块"，宽了就成白板。 */
  s07:function(fx,t){
    var c=t.c;
    iDiag(fx,c.ac,{y:24,h:32,a:.72,d:440,dl:0});
    iDiag(fx,'#FFFFFF',{y:50,h:10,a:.66,d:500,dl:80});
    iDiag(fx,c.ink,{y:72,h:22,a:.6,d:560,dl:150});
    iRgb(fx,c.ac,'#00E5FF',{dx:20,a:.42,d:460,dl:20});
    iSpeed(fx,'#FFFFFF',{n:12,len:120,len2:90,w:2,d:480,dl:10});
    iVig(fx,'rgba(0,0,0,.95)',{a:.26,d:600,dl:20});
  },
  /* 08 星盘 → 金色十字星 + 光环 + 金色碎屑，像指针归位时崩出的星屑 */
  s08:function(fx,t){
    var c=t.c;
    iStar(fx,'#F0D48A',{s:96,d:760,dl:20});
    iRing(fx,'#F0D48A',{w:320,bw:6,d:900,dl:20});
    iRing(fx,'rgba(240,212,138,.5)',{w:230,bw:3,d:1000,dl:120});
    iGlow(fx,'#F0D48A',{s:360,a:.6,d:1200,dl:20});
    iShard(fx,['#F0D48A','#FFFFFF'],{n:14,r1:50,r2:150,s:3,s2:5,dl:40});
    iVig(fx,'rgba(6,5,12,.95)',{a:.34,d:800,dl:20});
  },
  /* 09 绘本 → 绿色柔光 + 大而慢的波 + 淡光扫，纸感
     浅底主题：光扫用暖白半透明、强度 .3，靠动作不靠亮度 */
  s09:function(fx,t){
    var c=t.c;
    iGlow(fx,c.ac,{s:340,a:.5,d:1300,dl:40});
    iRing(fx,c.acd,{w:330,bw:9,d:1100,dl:40});
    iSweep(fx,'rgba(255,255,255,.5)',{a:.3,d:900,dl:60});
    iShard(fx,[c.ac,c.alt,'#FFFFFF'],{n:10,r1:40,r2:120,s:5,s2:6,dl:60});
  },
  /* 10 马克笔 → 横向撕裂 + 错位 + 一道光扫，像笔刷把画面刮了一下 */
  s10:function(fx,t){
    var c=t.c;
    iTear(fx,c.ac,{y:32,h:22,dx:30,a:.75,d:480,dl:0});
    iTear(fx,c.alt,{y:56,h:14,dx:-24,a:.6,d:520,dl:60});
    iTear(fx,'#FFFFFF',{y:74,h:10,dx:18,a:.5,d:460,dl:110});
    iRgb(fx,c.ac,'#8FD6D0',{dx:16,a:.45,d:420,dl:20});
    iSweep(fx,'rgba(255,255,255,.85)',{a:.6,d:620,dl:40});
  },
  /* 11 韩系高饱和 → 爆白 + 双波 + 十字星 + 碎片，最"闪"的一套 */
  s11:function(fx,t){
    var c=t.c;
    iFlash(fx,'#FFFFFF',.86,200,30);
    iRing(fx,'#FFFFFF',{w:330,bw:13,d:700,dl:30});
    iRing(fx,c.alt,{w:250,bw:8,d:800,dl:100});
    iStar(fx,'#FFFFFF',{s:64,dl:40});
    iStar(fx,c.ac,{x:28,y:28,s:30,dl:90});
    iPunch(t,{z:1.045,d:480,dl:20});
    iShard(fx,['#FFFFFF',c.ac,'#FFD93D','#7B3DFF'],{n:16,r1:50,r2:150,s:4,s2:7,dl:40});
  },
  /* 12 漫画 → 锯齿外圈 + 放射线 + 撕裂 + 压暗，最夸张的一套
     爆炸星只留外圈（中心镂空），锯齿咬边不盖字；速度线从中心放射出去，
     视觉上是「画面被这一拳打裂了」，不是「糊了一张白纸」 */
  s12:function(fx,t){
    var c=t.c;
    iBurst(fx,'#FFFFFF',{s:430,dl:0,rot:30,a:.85});
    iSpeed(fx,c.ink,{n:24,len:200,len2:130,w:2.6,d:520,dl:10});
    iTears(fx,c.ink,3,20);
    iFlash(fx,'#FFFFFF',.56,160,0);
    iPunch(t,{z:1.055,d:460,dl:10});
  },
  /* 13 都市漫画 → 墨点四散 + 一圈硬波 + 十字星，像笔尖把纸戳穿 */
  s13:function(fx,t){
    var c=t.c;
    iRing(fx,c.ink,{w:300,bw:9,d:640,dl:20});
    iRing(fx,c.ac,{w:220,bw:5,d:720,dl:90});
    iShard(fx,[c.ink,c.ac,c.ink2],{n:12,r1:40,r2:120,s:4,s2:6,dl:30});
    iStar(fx,c.ac,{s:40,dl:40});
    iSweep(fx,'rgba(255,255,255,.7)',{a:.5,d:700,dl:60});
  },
  /* 14 极简 → 克制：只有一道光扫和一点暖光，最轻的一套
     浅底主题，光扫强度只给 .26 */
  s14:function(fx,t){
    var c=t.c;
    iSweep(fx,'rgba(255,240,220,.55)',{a:.26,d:900,dl:40});
    iGlow(fx,c.ac,{s:300,a:.28,d:1300,dl:60});
    iVig(fx,'rgba(60,44,30,.9)',{a:.22,d:900,dl:40});
  },
  /* 15 水彩 → 三团彩色墨爆叠着化开 + 轻柔焦，纸上的水真的被撞了一下 */
  s15:function(fx,t){
    var c=t.c;
    iInk(fx,c.ac,{s:260,a:.45,d:1200,dl:0,x:40,y:38});
    iInk(fx,c.alt,{s:220,a:.4,d:1350,dl:90,x:62,y:52});
    iInk(fx,'#9BC17A',{s:200,a:.35,d:1250,dl:160,x:48,y:66});
    iBlur(t,{bl:1.3,d:900,dl:30});
    iGlow(fx,'#FFFFFF',{s:320,a:.45,d:1100,dl:40});
  },
  /* 16 水墨 → 一团大墨爆从中心压开 + 竖向扫描 + 压暗，最"东方"的一套 */
  s16:function(fx,t){
    var c=t.c;
    iInk(fx,'#0B0906',{s:340,a:.55,d:1300,dl:20,x:50,y:44});
    iInk(fx,c.ac,{s:230,a:.4,d:1200,dl:140,x:50,y:44});
    iGlow(fx,'#E8C471',{s:260,a:.5,d:1200,dl:60});
    iScan(fx,'rgba(232,196,113,.55)',{h:30,d:800,dl:60});
    iVig(fx,'rgba(0,0,0,.95)',{a:.34,d:900,dl:20});
  },
  /* 17 文艺 → 细斜带 + 细放射线 + 薄荷光，风过纸面的质感
     浅底主题：斜带和光都压到 .3 上下 */
  s17:function(fx,t){
    var c=t.c;
    iDiag(fx,'rgba(255,255,255,.55)',{y:34,h:26,a:.32,d:640,dl:20});
    iSpeed(fx,c.ac,{n:10,len:110,len2:70,w:1.6,d:560,dl:30});
    iGlow(fx,c.alt,{s:300,a:.34,d:1200,dl:40});
    iShard(fx,[c.ac,c.alt,'#7FC0B2'],{n:9,r1:30,r2:100,s:4,s2:5,dl:50});
  },
  /* 18 萌系 → 粉波 + 圆点碎屑 + 小星星，最"软"的一套 */
  s18:function(fx,t){
    var c=t.c;
    iRing(fx,'#F2A0A0',{w:300,bw:11,d:700,dl:40});
    iGlow(fx,c.ac,{s:320,a:.6,d:1100,dl:40});
    iShard(fx,['#F2A0A0','#FFFFFF',c.alt],{n:14,r1:40,r2:130,s:5,s2:7,dl:50});
    iStar(fx,'#FFFFFF',{x:50,y:30,s:26,dl:90});
    iStar(fx,'#F2A0A0',{x:26,y:56,s:18,dl:150});
  },
  /* 19 国风 → 朱红墨爆 + 金环 + 压暗，像一枚印压在绢上 */
  s19:function(fx,t){
    var c=t.c;
    iInk(fx,'#C0392B',{s:280,a:.5,d:1200,dl:20});
    iRing(fx,'#E8C471',{w:320,bw:7,d:1000,dl:40});
    iGlow(fx,'#E8C471',{s:300,a:.55,d:1300,dl:40});
    iScan(fx,'rgba(232,196,113,.4)',{h:26,d:900,dl:60});
    iVig(fx,'rgba(10,4,6,.95)',{a:.32,d:900,dl:20});
  },
  /* 20 治愈书页 → 暖光扫 + 椭圆波（书页是横的）+ 极轻柔焦
     这套底色是米白，白色高光一压就过曝，强度必须比别套低一档 */
  s20:function(fx,t){
    var c=t.c;
    iSweep(fx,'rgba(255,238,214,.75)',{a:.34,d:900,dl:20});
    iRing(fx,c.ac,{w:380,h:220,bw:7,rd:'50%',d:1000,dl:40});
    iRing(fx,'#E8DCC8',{w:300,h:170,bw:3,rd:'50%',d:1100,dl:120});
    iBlur(t,{bl:.9,d:900,dl:30});
    iGlow(fx,'#FFEFD8',{s:340,a:.34,d:1300,dl:40});
  },
  /* 21 时尚 → 珊瑚光 + 一圈细波 + 光扫 + 小星，最"精致"的一套 */
  s21:function(fx,t){
    var c=t.c;
    iGlow(fx,c.ac,{s:320,a:.7,d:1200,dl:40});
    iRing(fx,c.ac,{w:280,bw:6,d:820,dl:40});
    iRing(fx,'#FFFFFF',{w:200,bw:3,d:900,dl:130});
    iSweep(fx,'rgba(255,255,255,.9)',{a:.6,d:760,dl:60});
    iStar(fx,'#FFFFFF',{x:50,y:28,s:32,dl:80});
    iShard(fx,[c.ac,'#FFFFFF','#F2C6B8'],{n:8,r1:30,r2:100,s:4,s2:5,dl:60});
  }
};
/* 冲击层的容器是 fxStage（由 play() 负责清空），不是每套主题各自的 .fx。
   设计稿里 21 套主题各有 .fx 容器；真实前端只有一块共用的舞台，
   正好符合「一次只播一套」的行为。 */
function impact(t){
  var r=IMP[t.id]; if(!r) return;
  var stage=document.getElementById('fxStage'); if(!stage) return;
  try{ r(stage,t); }
  catch(e){ console.warn('impact fail: '+t.id,e); }
}

/* ══════════════════════════════════════════════════════════
   屏幕震动：21 套主题各一种震法
   amp   = 这条 keyframes 的名义幅度（px），用于日志与校准
   delay = 起震时刻（ms），对齐该主题动效的「重音」
   dur   = 持续时长（ms）
   所有震动的位移都留在手机壳内部，不改变卡片布局。
   ══════════════════════════════════════════════════════════ */
var SHK={
  s01:{k:'shkSlam',   amp:29,delay:0,   dur:520, e:'cubic-bezier(.36,.07,.19,.97)'}, // 印章砸下 → 砸到底再高频余震
  s02:{k:'shkRattle', amp:20,delay:50,  dur:500, e:'linear'},                          // 涂鸦炸开 → 立刻乱抖
  s03:{k:'shkTap',    amp:20,delay:0,   dur:400, e:'cubic-bezier(.3,1.5,.5,1)'},        // 贴纸啪上 → 硬着陆压扁
  s04:{k:'shkCrt',    amp:22,delay:0,   dur:520, e:'steps(6,end)'},                     // 清线扫过 → 像走纸错位
  s05:{k:'shkFloatUp',amp:28,delay:60,  dur:1050,e:'cubic-bezier(.3,.7,.3,1)'},         // 星月浮起 → 被托起再落下
  s06:{k:'shkBeat',   amp:16,delay:120, dur:900, e:'ease-in-out'},                     // 缎带飘落 → 心跳两下
  s07:{k:'shkSlash',  amp:25,delay:0,   dur:480, e:'cubic-bezier(.4,0,.5,1)'},         // 斜切冲击 → 沿斜向推
  s08:{k:'shkSpin',   amp:19,delay:0,   dur:1200,e:'ease-out'},                        // 星盘展开 → 歪一下再摆正
  s09:{k:'shkRise',   amp:23,delay:120, dur:1000,e:'cubic-bezier(.3,1.3,.5,1)'},       // 藤蔓生长 → 向上顶
  s10:{k:'shkSwipe',  amp:24,delay:0,   dur:640, e:'ease-in-out'},                     // 马克笔涂抹 → 横刷四程
  s11:{k:'shkHop',    amp:27,delay:90,  dur:680, e:'cubic-bezier(.3,1.6,.4,1)'},        // 图标弹开 → 蹦两下
  s12:{k:'shkWobble', amp:24,delay:0,   dur:540, e:'cubic-bezier(.36,.07,.19,.97)'},    // 小人探头 → 整屏甩
  s13:{k:'shkPress',  amp:15,delay:480, dur:460, e:'cubic-bezier(.3,1.4,.5,1)'},        // 日程打勾 → 笔尖压下
  s14:{k:'shkSettle', amp:14,delay:0,   dur:1000,e:'cubic-bezier(.3,.7,.3,1)'},         // 天际线升起 → 最轻的一档
  s15:{k:'shkSway',   amp:22,delay:0,   dur:1100,e:'ease-in-out'},                     // 水彩晕开 → 水被撞晃
  s16:{k:'shkBloom',  amp:19,delay:180, dur:1500,e:'cubic-bezier(.2,.8,.3,1)'},        // 水墨浮现 → 慢慢洇开
  s17:{k:'shkGust',   amp:24,delay:0,   dur:820, e:'cubic-bezier(.3,.8,.3,1)'},        // 风吹麦浪 → 被推一下
  s18:{k:'shkHop',    amp:27,delay:160, dur:680, e:'cubic-bezier(.3,1.6,.4,1)'},        // 猫咪打滚 → 蹦两下
  s19:{k:'shkCloud',  amp:24,delay:180, dur:1500,e:'cubic-bezier(.2,.8,.3,1)'},        // 云纹展开 → 外扩上浮
  s20:{k:'shkPage',   amp:22,delay:0,   dur:1350,e:'cubic-bezier(.3,.6,.3,1)'},        // 书页翻开 → 3D 转带动横甩
  s21:{k:'shkKiss',   amp:16,delay:560, dur:620, e:'cubic-bezier(.3,1.5,.5,1)'}        // 花瓣唇印 → 唇印落下时
};

/* 起震：同一条动画重复触发要先移除再强制回流，否则第二次不播 */
function shake(t){
  /* 两层同时上才够劲：震动是「整块屏幕被推」，冲击是「画面本身挨了一拳」 */
  impact(t);
  var el=document.documentElement;
  var s=SHK[t.id]||SHK.s01;
  el.classList.remove('ph-shk');
  void el.offsetWidth;
  el.style.setProperty('--shk',s.k);
  el.style.setProperty('--shkd',(s.dur/1000)+'s');
  el.style.setProperty('--shke',s.e);
  el.style.animationDelay=(s.delay/1000)+'s';
  el.classList.add('ph-shk');
  clearTimeout(el._shkT);
  el._shkT=setTimeout(function(){
    el.classList.remove('ph-shk');
    el.style.animationDelay='0s';
  },s.delay+s.dur+80);
  return s.delay+s.dur;
}

/* 调试/验收出口：外部可查每套震法参数（不影响运行） */
window.SB_SHK={map:SHK,impact:IMP,
  peak:function(id){var s=SHK[id];return s?s.delay+s.dur*0.26:0;},
  amp:function(id){return (SHK[id]||{}).amp||0;}};

var MV={};

/* 01 印章砸下 */
MV.stamp=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'fxF');
  var mid=box(fx);
  var seal=put(mid,'seal','--c1:'+c.ac+';--ob:#0B0B0B');
  put(seal,'sd'); put(seal,'sr');
  var st=put(seal,'st');
  put(st,'','','CHECKED','span');
  put(st,'','','DONE','b');
  put(st,'','',W+' WORDS','span');
  put(mid,'ring','--c:'+c.alt+';animation-delay:0ms;animation-duration:2.6s');
  put(mid,'ring','--c:'+c.ac+';animation-delay:90ms;animation-duration:3.2s');
  for(var i=0;i<44;i++)
    put(mid,'ray','--a:'+(i*360/44)+'deg;--c:'+c.ink+';animation-delay:'+(i*1.4)+'ms');
  for(var j=0;j<14;j++){
    var a=R()*360, d=64+R()*74;
    put(mid,'bit','--dx:'+(Math.cos(a*DEG)*d).toFixed(1)+'px;--dy:'
      +(Math.sin(a*DEG)*d).toFixed(1)+'px;--c:'+(j%3?c.alt:c.ac)
      +';animation-delay:'+(20+R()*70)+'ms');
  }
  [['+'+W+' 词','#0B0B0B',-9],['连续 '+ST+' 天',c.alt,0],['已掌握 '+PCT+'%',c.ac,10]]
  .forEach(function(g,i){
    put(mid,'stk','--c:'+g[1]+';--rot:'+g[2]+'deg;animation-delay:'+(560+i*95)+'ms',g[0]);
  });
  setTimeout(function(){clear(fx);},1900);return 1900;
};

/* 02 涂鸦炸开 */
MV.doodle=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var cols=[c.ac,'#E0332B',c.alt,'#2E7DD1','#6BBF59'];
  var gl=['★','♥','✦','●','▲','✿','✚'];
  var mid=box(fx);
  for(var i=0;i<36;i++){
    var a=R()*360, d=36+R()*108;
    put(mid,'dood','--dx:'+(Math.cos(a*DEG)*d).toFixed(1)+'px;--dy:'
      +(Math.sin(a*DEG)*d).toFixed(1)+'px;--rot:'+(R()*540-270)+'deg;color:'
      +cols[i%cols.length]+';font-size:'+(9+R()*20)+'px;animation-delay:'+(R()*190)+'ms'
      ,gl[i%gl.length]);
  }
  for(var k=0;k<6;k++)
    put(mid,'squig','--rot:'+(R()*360)+'deg;--c:'+cols[k%cols.length]
      +';animation-delay:'+(R()*170)+'ms');
  var tw=document.createElement('div');
  tw.className='tagWrap';
  fx.appendChild(tw);
  put(tw,'tagz','--c:'+c.ac+';animation-delay:430ms','今天也乱糟糟地学完了');
  setTimeout(function(){clear(fx);},1700);return 1700;
};

/* 03 贴纸啪上 */
MV.sticker=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  // 三张贴纸分散在屏幕不同位置，各自角度不同，不堆在中心
  [['已打卡','#FFFFFF','#101010',-8,'52%','13%'],
   [W+' 词',c.alt,'#101010',6,'50%','27%'],
   ['连续 '+ST+' 天',c.ac,'#101010',-5,'48%','62%']]
  .forEach(function(g,i){
    var d=put(mid,'stk2','background:'+g[1]+';--fg:'+g[2]+';--rot:'+g[3]+'deg;'
      +'left:'+g[4]+';top:'+g[5]+';animation-delay:'+(i*150)+'ms',g[0]);
  });
  put(mid,'popT','--c:'+c.ac+';animation-delay:500ms','POP!');
  setTimeout(function(){clear(fx);},1900);return 1900;
};

/* 04 清线扫过 */
MV.sweep=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'sweepB sweepL','--c:'+c.ac);
  put(fx,'sweepB sweepR','--c:'+c.alt);
  put(fx,'hline','--c:'+c.ink);
  var mid=box(fx);
  put(mid,'recT','','RECORDED · NOV 22');
  setTimeout(function(){clear(fx);},1700);return 1700;
};

/* 05 星月浮起 */
MV.dream=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'glowB','--c:'+c.ac);
  var mid=box(fx);
  put(mid,'moonC');
  for(var i=0;i<20;i++){
    var sz=(1.6+R()*2.6).toFixed(1);
    // 只落在顶部 0–26% 和 78–92% 两条带里，绕开中间的信息区
    var tp = i%2 ? (2+R()*22) : (78+R()*13);
    put(mid,'starP','--c:'+(i%3?c.ac:'#fff')
      +';left:'+(6+R()*88).toFixed(1)+'%;top:'+tp.toFixed(1)+'%;'
      +'width:'+sz+'px;height:'+sz+'px;'
      +'animation-delay:'+(R()*560).toFixed(0)+'ms');
  }
  put(mid,'softT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;'
    +'animation-delay:640ms','晚安，今天很努力');
  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 06 缎带飘落 */
MV.ribbon=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'veil','--c:'+c.ac+'26');
  var mid=box(fx);
  var gl=['✿','♥','✚','❀','✧'];
  for(var i=0;i<17;i++){
    put(mid,'ribP','--x0:'+(R()*270-135).toFixed(0)+'px;--x1:'+(R()*60-30).toFixed(0)+'px;'
      +'--rot:'+(R()*90-45).toFixed(0)+'deg;color:'+[c.ac,c.alt,'#E4B7D8'][i%3]
      +';font-size:'+(9+R()*13).toFixed(0)+'px;left:50%;top:4%;animation-delay:'
      +(R()*520)+'ms',gl[i%gl.length]);
  }
  put(mid,'softT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:660ms','今天也乖乖完成了');
  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 07 斜切冲击 */
MV.slice=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  for(var i=0;i<3;i++)
    put(fx,'sliceB','--c:'+(i===1?'#FFFFFF':c.ac)+';top:'+(4+i*32)+'%;animation-delay:'
      +(i*85)+'ms');
  put(fx,'halftone');
  var mid=box(fx);
  put(mid,'tokyoT','--c:'+c.ac,'TOKYO / 22 NOV');
  setTimeout(function(){clear(fx);},1600);return 1600;
};

/* 08 星盘展开 */
MV.zodiac=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  var disc=put(mid,'discW','--c:'+c.ac+'66');
  var N=12, R=86;
  for(var i=0;i<N;i++){
    var a=i*360/N-90;
    var px=Math.cos(a*DEG)*R, py=Math.sin(a*DEG)*R;
    // 节点：以圆盘为参照，用 left/top 百分比 + translate(-50%,-50%) 定位
    put(disc,'nodeD','--c:'+c.acd
      +';left:'+(50+px/186*100).toFixed(2)+'%;top:'+(50+py/186*100).toFixed(2)+'%'
      +';transform:translate(-50%,-50%);animation-delay:'+(i*44)+'ms');
    // 连线：从圆心指向节点，长度就是半径
    put(disc,'lineD','--c:'+c.ac
      +';left:50%;top:50%;width:'+R+'px;'
      +'transform:translateY(-50%) rotate('+(a+0)+'deg);animation-delay:'+(i*44)+'ms');
  }
  put(disc,'coreD','--c:'+c.acd+';animation-delay:560ms');
  put(mid,'zT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:900ms','星象已记录');
  setTimeout(function(){clear(fx);},2200);return 2200;
};

/* 09 藤蔓生长 */
MV.vine=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  // 独立画布：只占屏幕中间那条柱状图区域，不碰文字
  var pad=document.createElement('div');
  pad.style.cssText='position:absolute;left:0;right:0;top:30%;height:26%;pointer-events:none';
  fx.appendChild(pad);

  var stem=document.createElement('div');
  stem.className='stemV';
  stem.style.cssText='--c:'+c.acd+';left:66%;bottom:0;height:100%;animation-delay:0ms';
  pad.appendChild(stem);

  for(var i=0;i<5;i++){
    var sd=(i%2)?1:-1;
    var lf=document.createElement('div');
    lf.className='leafV';
    lf.style.cssText='--c:'+[c.ac,c.acd,c.alt][i%3]
      +';left:calc(66% + '+(sd*5)+'px);bottom:'+(16+i*19)+'%;'
      +'transform:rotate('+(sd*(26+i*4))+'deg);animation-delay:'+(150+i*105)+'ms';
    pad.appendChild(lf);
  }
  var b1=document.createElement('div');
  b1.className='bloomV';
  b1.style.cssText='--c:'+c.alt+';left:calc(66% - 20px);bottom:96%;animation-delay:860ms';
  pad.appendChild(b1);
  var b2=document.createElement('div');
  b2.className='bloomV';
  b2.style.cssText='--c:'+c.ac+';left:calc(66% + 6px);bottom:86%;animation-delay:930ms';
  pad.appendChild(b2);

  var mid=box(fx);
  put(mid,'vineT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;'
    +'animation-delay:1000ms','今天长了一点点');

  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 10 马克笔涂抹 */
MV.marker=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var cols=[c.ac,c.alt,'#F7C9A8','#A8D8D0'];
  // 只涂上半屏与待办间隙，避开底部文案带（439–486）
  var yPos=[15,31,47,58];
  for(var i=0;i<4;i++)
    put(fx,'markB','--c:'+cols[i]+';top:'+yPos[i]+'%;height:'+(i===3?12:20)+'px;'
      +'animation-delay:'+(i*115)+'ms');
  var mid=box(fx);
  put(mid,'markerT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:580ms','画好了，今天 '+W+' 词');
  setTimeout(function(){clear(fx);},1900);return 1900;
};

/* 11 图标弹开 */
MV.icons=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  var set=[['♥','#FF3D9A'],['★','#FFD93D'],['✿','#7B3DFF'],['❀','#3DD6C9'],
           ['✦','#FF7B3D'],['☀','#FFD93D'],['✧','#FF3D9A']];
  set.forEach(function(g,i){
    var a=i*360/set.length-90, d=62+R()*26;
    put(mid,'icoP','--dx:'+(Math.cos(a*DEG)*d).toFixed(1)+'px;--dy:'
      +(Math.sin(a*DEG)*d).toFixed(1)+'px;--rot:'+(R()*120-60)+'deg;color:'+g[1]
      +';font-size:'+(15+R()*9).toFixed(0)+'px;animation-delay:'+(i*46)+'ms',g[0]);
  });
  // 标签靠左下角悬浮，与统计数字和按钮都错开；底边同样要抬到 tabbar 之上
  var gw=document.createElement('div');
  gw.style.cssText='position:absolute;left:18px;bottom:'+bottomAboveTab()+';pointer-events:none';
  fx.appendChild(gw);
  put(gw,'goT','--c:'+c.ac+';animation-delay:430ms;font-size:11px;padding:6px 10px','GOOD DAY!');
  setTimeout(function(){clear(fx);},1800);return 1800;
};

/* 12 小人探头 */
MV.chibi=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var b=put(fx,'chibi','--c:'+c.ac+';--ob:'+c.ink);
  put(b,'ch-hood');
  var e=put(b,'ch-eye'); put(e,'','','','i'); put(e,'','','','i');
  var k=put(b,'ch-cheek'); put(k,'','','','i'); put(k,'','','','i');
  put(b,'ch-mouth');
  put(fx,'bub','--c:'+c.ink+';right:5%;top:11%','今天也超好!');
  setTimeout(function(){clear(fx);},2500);return 2500;
};

/* 13 日程打勾 */
MV.diary=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','tickS');
  svg.setAttribute('viewBox','0 0 128 86');
  svg.innerHTML='<path d="M13 45 L46 73 L115 11" fill="none" stroke="'+c.ac
    +'" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
  mid.appendChild(svg);
  for(var i=0;i<3;i++)
    put(fx,'steamS','--c:'+c.acd+';left:'+(37+i*9)+'%;animation-delay:'+(i*190)+'ms');
  put(mid,'diaryT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:780ms','记下了 · '+W+' 词');
  setTimeout(function(){clear(fx);},2200);return 2200;
};

/* 14 天际线升起 */
MV.skyline=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  put(mid,'sunC','--c:'+c.ac);
  put(fx,'skyL','--c:'+c.ink);
  put(mid,'skyT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:920ms','今天，'+W+' 个词。');
  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 15 水彩晕开 */
MV.watercolor=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  for(var i=0;i<5;i++){
    var s=68+i*22;
    put(mid,'washB','--c:'+[c.ac,c.alt,'#9BC17A','#E8C471',c.ac][i]
      +';width:'+s+'px;height:'+s+'px;margin:'+(R()*50-40).toFixed(0)+'px 0 0 '
      +(R()*70-60).toFixed(0)+'px;animation-delay:'+(i*115)+'ms');
  }
  put(mid,'washT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:780ms','今天的水彩，'+W+' 笔');
  setTimeout(function(){clear(fx);},2500);return 2500;
};

/* 16 水墨浮现 */
MV.ink=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'mountI','--c:#0B0906');
  put(fx,'inkW','--c:'+c.ac+'8C');
  put(fx,'lampL','--c:'+c.acd+';left:calc(50% - 5px)');
  put(fx,'inkT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center','一盏灯，'+W+' 个词');
  setTimeout(function(){clear(fx);},2700);return 2700;
};

/* 17 风吹麦浪 */
MV.wind=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'gustW','--c:'+c.ac);
  var mid=box(fx);
  for(var i=0;i<13;i++){
    var a=(-40+R()*70)*DEG, d=40+R()*125;
    put(mid,'petalW','--dx:'+(Math.cos(a)*d).toFixed(1)+'px;--dy:'
      +(-Math.abs(Math.sin(a))*d-30).toFixed(1)+'px;--rot:'+(R()*220).toFixed(0)+'deg;'
      +'background:'+[c.ac,c.alt,'#7FC0B2'][i%3]
      +';width:'+(7+R()*9).toFixed(0)+'px;height:'+(5+R()*6).toFixed(0)+'px;'
      +'animation-delay:'+(R()*380)+'ms');
  }
  put(mid,'windT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:660ms','风把你的努力记下了');
  setTimeout(function(){clear(fx);},2300);return 2300;
};

/* 18 猫咪打滚 */
MV.cat=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  // 独立画布：只在柱状图那一带活动，不压待办、进度、统计
  var pad=document.createElement('div');
  pad.style.cssText='position:absolute;left:0;right:0;top:27%;height:19%;pointer-events:none';
  fx.appendChild(pad);

  var cat=put(pad,'catC','--ob:'+c.acd);
  var e=put(cat,'ct-ear'); put(e,'','','','i'); put(e,'','','','i');
  var y=put(cat,'ct-eye'); put(y,'','','','i'); put(y,'','','','i');
  put(cat,'ct-nose');

  for(var i=0;i<7;i++){
    var px=28+(i*7)*(i%2?1:1.15);
    put(pad,'heartC','color:'+[c.alt,'#F2A0A0',c.ac][i%3]
      +';left:'+(px+R()*7-3).toFixed(1)+'%;top:'+(18+R()*40).toFixed(0)+'%;--dy:-'
      +(14+R()*20).toFixed(0)+'px;font-size:'+(8+R()*7).toFixed(0)+'px;animation-delay:'
      +(360+R()*300)+'ms','♥');
  }
  var mid=box(fx);
  put(mid,'catT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:920ms','喵 · 今天也完成了');
  setTimeout(function(){clear(fx);},2500);return 2500;
};

/* 19 云纹展开 */
MV.cloud=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;

  // 底部氛围泛光：只落在按钮与统计之间那条留白带，不冲淡正文
  var fl=document.createElement('div');
  fl.className='floodC';
  fx.appendChild(fl);

  // 云纹：全部收在右上角主视觉区右侧留白（cx 250 / cy 118），不碰正文
  var pad=document.createElement('div');
  pad.style.cssText='position:absolute;left:0;right:0;top:0;height:190px;pointer-events:none;overflow:hidden';
  fx.appendChild(pad);
  for(var i=0;i<4;i++){
    var s=46+i*24;
    put(pad,'cloudC','border-color:'+c.acd+';width:'+s+'px;height:'+s+'px;'
      +'left:226px;top:118px;animation-delay:'+(i*118)+'ms');
  }

  // 朱印落在「连续 12 天」右侧那片空区
  put(pad,'sealS','background:#C0392B;left:212px;top:88px;animation-delay:720ms','今日');

  var mid=box(fx);
  put(mid,'cloudT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:980ms','云开，今日已成');
  setTimeout(function(){clear(fx);},2600);return 2600;
};

/* 20 书页翻开 */
MV.page=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'pageF');
  put(fx,'pageS');
  put(fx,'lightL','--c:'+c.ac+'5C');
  var mid=box(fx);
  for(var i=0;i<10;i++)
    put(mid,'dustP','background:'+c.ac+';left:calc(50% + '
      +(R()*240-120).toFixed(0)+'px);top:calc(50% + '+(R()*150-75).toFixed(0)+'px);'
      +'--dy:-'+(20+R()*44).toFixed(0)+'px;animation-delay:'+(780+R()*520)+'ms');
  put(mid,'pageT','--c:'+c.acd+';bottom:'+bottomAboveTab()+';left:0;right:0;text-align:center;animation-delay:980ms','这一页，翻过去了');
  setTimeout(function(){clear(fx);},2800);return 2800;
};

/* 21 花瓣与唇印 */
MV.petal=function(fx,t){
  shake(t);
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;

  // 花瓣只从柱状图那条带子往上飘，不落进待办和统计
  var pad=document.createElement('div');
  pad.style.cssText='position:absolute;left:0;right:0;top:31%;height:14%;pointer-events:none';
  fx.appendChild(pad);
  for(var i=0;i<10;i++)
    put(pad,'petalP','--x0:'+(R()*220-110).toFixed(0)+'px;--x1:'
      +(R()*60-30).toFixed(0)+'px;--rot:'+(R()*200).toFixed(0)+'deg;background:'
      +[c.ac,c.alt,'#F2C6B8'][i%3]+';left:50%;top:78%;animation-delay:'
      +(R()*360)+'ms');

  /* 唇印必须按真实「已掌握」进度条来放，不能写死 bottom：
     舞台是固定 548 高的画布，窗口比它矮时画布下半截在屏幕外，
     bottom 锚点会跟着掉下去（410×540 实测低 106px，直接落在打卡按钮旁边）。
     量得到进度条就按它算：唇印中心落在条宽 21.6% 处、视觉底贴条顶上方 3.4px
     → 未缩放盒 top = 条顶 - 26.5（26 是盒高，0.54 是 scale .78 后上下各缩掉的量）。
     量不到（比如不在今日页）才退回设计稿的固定值。 */
  var trk=anchorOf('#view-today .ptrack');
  var lipCss = trk
    ? '--c:'+c.ac+';left:'+(trk.l+trk.w*0.216-26).toFixed(1)+'px;'
      +'top:'+(trk.t-26.5).toFixed(1)+'px;transform-origin:50% 50%;scale:.78;animation-delay:640ms'
    : '--c:'+c.ac+';left:calc(22% - 18px);bottom:191px;'
      +'transform-origin:50% 50%;scale:.78;animation-delay:640ms';
  var lip=put(fx,'lipP',lipCss);
  for(var k=0;k<4;k++) put(lip,'','','','i');

  /* More Love：优先放「打卡按钮」与底部切换栏之间的留白；
     那块太窄就退回「统计栏与按钮之间」；都拿不到才贴 tabbar 上沿。
     居中用 left:50%——.loveT 挂 kPopC，关键帧自带 translateX(-50%)，
     换成 left:0;width:100% 会被这层 -50% 再推半个身位，文字直接出屏。 */
  var mid=box(fx);
  /* More Love 的落位。设计稿把它放在 bottom:62px（548 画布，≈y486），
     位置在打卡按钮上方一点。前端 .view 是可滚动的，高度随窗口变，
     所以必须按真实控件反算，规则按「从最贴设计稿到最保守」排序：
       ① 按钮下沿 ~ tabbar 上沿的净空         （最接近设计稿：按钮旁）
       ② 统计栏下沿 ~ 按钮上沿的缝            （次选，也是留白）
       ③ 都放不下就放弃这条文案               （宁可不出，绝不压数字）
     ⚠ 这里踩过的坑：短窗口（410×540）下按钮底边本身就顶到 tabbar
     （.app 的 64px 下内边距 == tabbar 高），① 的净空是负的；
     曾经退到「统计栏内部居中」，结果正好压住「近七天均值」那个 0。
     统计栏三列都排满数字，里面没有任何安全位置，所以 ② 只能取
     「统计栏之下、按钮之上」这条缝，绝不能进统计栏里面。
     ⚠ 另一个坑：.pstat / #checkinBtn 在回顾页、设置页也有同名节点，
     选择器必须限定 #view-today，否则量到隐藏元素（rect 全 0）。 */
  var btn=anchorOf('#view-today #checkinBtn') || anchorOf('#checkinBtn');
  var tb=anchorOf('.tabbar');
  var pst=anchorOf('#view-today .pstat') || anchorOf('.pstat');
  var H=stageH(), LIMIT=19, topPx=null;
  if(btn){
    var below=btn.t+btn.h;
    var roomBelow = tb ? (tb.t-below) : 60;
    if(roomBelow>=LIMIT+6){
      topPx=below+Math.max(3,(roomBelow-LIMIT)/2);
    }else if(pst && pst.h>0){
      var gTop=pst.t+pst.h, gH=btn.t-gTop;
      if(gH>=LIMIT+2) topPx=gTop+(gH-LIMIT)/2;   /* 统计栏之下、按钮之上 */
    }
    if(topPx!=null && tb && tb.h>0) topPx=Math.min(topPx, tb.t-4-LIMIT);
    if(topPx!=null) topPx=Math.max(0,Math.min(topPx, H-LIMIT));
  }
  if(topPx!=null){
    put(mid,'loveT','--c:'+c.acd+';top:'+topPx.toFixed(1)+'px;left:50%;animation-delay:980ms','More Love');
  }
  /* 放不下就不放：s21 顶部右侧本来就有静态「More Love」装饰，
     动画版只是锦上添花，压在数字上比不出现更糟。 */
  setTimeout(function(){clear(fx);},2600);return 2600;
};

/* ══ 对外入口 ══ */
var BY={};
(window.SB_THEMES.list||[]).forEach(function(t){ BY[t.id]=t; });

var layer=null, stage=null;

function ensure(){
  if(layer) return true;
  layer=document.getElementById('fxLayer');
  stage=document.getElementById('fxStage');
  return !!(layer&&stage);
}

/* 舞台缩放：设计稿 312×548 → 真机。
 *
 * 横向：按宽度等比放大（390/312 = 1.25），左右正好铺满。
 * 纵向：舞台从屏幕顶部起，一直拉到屏幕底部（不足 548 时按 548）。
 *
 * 为什么要拉长而不是居中留黑边：这套动效里有一半是全屏层
 * （.fxF 闪白、.glowB 暖光、.veil 薄纱、.halftone 网点、.pageF 翻页、
 * .floodC 泛光），它们用 inset:0 / bottom:0 铺满舞台。若舞台按 548
 * 居中，这些层会在屏幕上下面各留 79px 的硬边，看起来像一块贴上去的卡片，
 * 而不是整屏特效。拉长后 y=0 与屏幕顶对齐，设计稿里所有
 * 「top:30%」「bottom:88px」这类避开正文的坐标继续成立，
 * 全屏层也真正铺满。
 * 用 transform-origin:0 0 + 手算 left，避免 translate(-50%) 与 scale
 * 的顺序陷阱（百分比按未缩放尺寸算，会偏半个屏）。 */
function fit(){
  if(!ensure()) return;
  var w=layer.clientWidth, h=layer.clientHeight;
  if(!w||!h) return;
  /* 舞台尺寸 = .app 的真实可视区，宽高分开算。
     【曾经的 bug】只按宽度缩放（s=w/312，高度固定 548*s 再居中）：
       · 窗口比 548*s 矮 → top 夹成 0，画布下半截溢出屏幕，
         于是写死 bottom:34px 的 14 套底部文案整条跑出视口
         （s21 的 More Love、s13/s16/s19 等全部中招）；
       · 窗口比它高 → 上下各留 79px 硬边，全屏特效像贴了一块卡片。
     正确做法：宽用 min(屏宽,430) 换算 s；高按 h 反算需要多少设计稿像素，
     把画布高度撑到刚好铺满，纵向不缩放、不平移。这样 y=0 永远贴屏幕顶，
     设计稿里的 top/bottom 坐标语义不变。 */
  var vw=Math.min(w,430);
  var s=vw/312;
  /* 画布高度 = 视口高 ÷ 缩放比：让「舞台底边」与「屏幕底边」永远重合，
     底部锚定（bottom:xx）的语义才稳定。之前用 max(548, h/s) 保底，
     短窗口（如 410×540）会把画布拉到 720 高、超出屏幕 180px，
     所有贴底的层就掉到视口外——这正是底部文案消失的直接原因。 */
  var dh=h/s;
  var sh=dh*s;
  stage.style.width='312px';
  stage.style.height=dh.toFixed(1)+'px';
  stage.style.transform='scale('+s.toFixed(4)+')';
  stage.style.left=Math.max(0,(w-312*s)/2).toFixed(1)+'px';
  /* 视觉顶端对齐 .app 顶部。sh 已等于 h，不再居中留白 */
  stage.style.top='0px';
  var bleed=0;
  layer.style.setProperty('--bleed', bleed.toFixed(1)+'px');
  /* 让依赖舞台高度的层知道「底部」在哪：设计稿 548 → 实际 dh */
  layer.style.setProperty('--dh', dh.toFixed(1));
}

function play(id, data){
  if(!ensure()) return false;
  var t=BY[id];
  if(!t || !t.mv || !MV[t.mv.k]) return false;
  if(layer.dataset.busy==='1') return false;

  fit();
  layer.dataset.busy='1';
  layer.classList.add('on');
  stage.innerHTML='';

  var dur=3000;
  try{ dur=MV[t.mv.k](stage, {c:t.c, id:t.id, d:data||{}}) || 3000; }
  catch(e){ console.error('fx fail: '+id, e); stage.innerHTML=''; }

  setTimeout(function(){
    stage.innerHTML='';
    layer.classList.remove('on');
    layer.dataset.busy='';
  }, dur+140);
  return true;
}

window.SB_FX={
  play:play,
  fit:fit,
  stop:function(){
    if(!ensure()) return;
    stage.innerHTML='';
    layer.classList.remove('on');
    layer.dataset.busy='';
  },
  keys:function(){ return Object.keys(MV); }
};

if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded', fit);
else fit();
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', function(){ setTimeout(fit, 120); });

})();
