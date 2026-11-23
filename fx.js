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
@keyframes kFlash{0%{opacity:0}32%{opacity:.82}100%{opacity:0}}
@keyframes kShake{0%,100%{transform:none}
 18%{transform:translate(3px,-2px)}36%{transform:translate(-3px,2px)}
 54%{transform:translate(2px,1px)}72%{transform:translate(-2px,-1px)}86%{transform:translate(1px,0)}}
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
.fx-shake{animation:kShake .52s cubic-bezier(.36,.07,.19,.97)}
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
 50%{opacity:.42;transform:scale(1.03)}100%{opacity:.32;transform:scale(1)}}`;

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

var MV={};

/* 01 印章砸下 */
MV.stamp=function(fx,t){
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var ph=document.getElementById('view-today');
  ph.classList.add('fx-shake');
  setTimeout(function(){ph.classList.remove('fx-shake');},560);
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
  put(mid,'softT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;'
    +'animation-delay:640ms','晚安，今天很努力');
  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 06 缎带飘落 */
MV.ribbon=function(fx,t){
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
  put(mid,'softT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:660ms','今天也乖乖完成了');
  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 07 斜切冲击 */
MV.slice=function(fx,t){
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
  put(mid,'zT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:900ms','星象已记录');
  setTimeout(function(){clear(fx);},2200);return 2200;
};

/* 09 藤蔓生长 */
MV.vine=function(fx,t){
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
  put(mid,'vineT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;'
    +'animation-delay:1000ms','今天长了一点点');

  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 10 马克笔涂抹 */
MV.marker=function(fx,t){
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var cols=[c.ac,c.alt,'#F7C9A8','#A8D8D0'];
  // 只涂上半屏与待办间隙，避开底部文案带（439–486）
  var yPos=[15,31,47,58];
  for(var i=0;i<4;i++)
    put(fx,'markB','--c:'+cols[i]+';top:'+yPos[i]+'%;height:'+(i===3?12:20)+'px;'
      +'animation-delay:'+(i*115)+'ms');
  var mid=box(fx);
  put(mid,'markerT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:580ms','画好了，今天 '+W+' 词');
  setTimeout(function(){clear(fx);},1900);return 1900;
};

/* 11 图标弹开 */
MV.icons=function(fx,t){
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
  // 标签靠左下角悬浮，与统计数字和按钮都错开
  var gw=document.createElement('div');
  gw.style.cssText='position:absolute;left:18px;bottom:34px;pointer-events:none';
  fx.appendChild(gw);
  put(gw,'goT','--c:'+c.ac+';animation-delay:430ms;font-size:11px;padding:6px 10px','GOOD DAY!');
  setTimeout(function(){clear(fx);},1800);return 1800;
};

/* 12 小人探头 */
MV.chibi=function(fx,t){
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
  put(mid,'diaryT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:780ms','记下了 · '+W+' 词');
  setTimeout(function(){clear(fx);},2200);return 2200;
};

/* 14 天际线升起 */
MV.skyline=function(fx,t){
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  put(mid,'sunC','--c:'+c.ac);
  put(fx,'skyL','--c:'+c.ink);
  put(mid,'skyT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:920ms','今天，'+W+' 个词。');
  setTimeout(function(){clear(fx);},2400);return 2400;
};

/* 15 水彩晕开 */
MV.watercolor=function(fx,t){
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  var mid=box(fx);
  for(var i=0;i<5;i++){
    var s=68+i*22;
    put(mid,'washB','--c:'+[c.ac,c.alt,'#9BC17A','#E8C471',c.ac][i]
      +';width:'+s+'px;height:'+s+'px;margin:'+(R()*50-40).toFixed(0)+'px 0 0 '
      +(R()*70-60).toFixed(0)+'px;animation-delay:'+(i*115)+'ms');
  }
  put(mid,'washT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:780ms','今天的水彩，'+W+' 笔');
  setTimeout(function(){clear(fx);},2500);return 2500;
};

/* 16 水墨浮现 */
MV.ink=function(fx,t){
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'mountI','--c:#0B0906');
  put(fx,'inkW','--c:'+c.ac+'8C');
  put(fx,'lampL','--c:'+c.acd+';left:calc(50% - 5px)');
  put(fx,'inkT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center','一盏灯，'+W+' 个词');
  setTimeout(function(){clear(fx);},2700);return 2700;
};

/* 17 风吹麦浪 */
MV.wind=function(fx,t){
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
  put(mid,'windT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:660ms','风把你的努力记下了');
  setTimeout(function(){clear(fx);},2300);return 2300;
};

/* 18 猫咪打滚 */
MV.cat=function(fx,t){
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
  put(mid,'catT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:920ms','喵 · 今天也完成了');
  setTimeout(function(){clear(fx);},2500);return 2500;
};

/* 19 云纹展开 */
MV.cloud=function(fx,t){
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
  put(mid,'cloudT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:980ms','云开，今日已成');
  setTimeout(function(){clear(fx);},2600);return 2600;
};

/* 20 书页翻开 */
MV.page=function(fx,t){
  var c=t.c, d=t.d||{}, W=d.words==null?0:d.words, ST=d.streak==null?0:d.streak, PCT=d.pct==null?0:d.pct;
  put(fx,'pageF');
  put(fx,'pageS');
  put(fx,'lightL','--c:'+c.ac+'5C');
  var mid=box(fx);
  for(var i=0;i<10;i++)
    put(mid,'dustP','background:'+c.ac+';left:calc(50% + '
      +(R()*240-120).toFixed(0)+'px);top:calc(50% + '+(R()*150-75).toFixed(0)+'px);'
      +'--dy:-'+(20+R()*44).toFixed(0)+'px;animation-delay:'+(780+R()*520)+'ms');
  put(mid,'pageT','--c:'+c.acd+';bottom:34px;left:0;right:0;text-align:center;animation-delay:980ms','这一页，翻过去了');
  setTimeout(function(){clear(fx);},2800);return 2800;
};

/* 21 花瓣与唇印 */
MV.petal=function(fx,t){
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

  // 唇印落在统计栏与按钮之间的留白带（415–493）
  var lip=put(fx,'lipP','--c:'+c.ac+';right:26px;bottom:46px;animation-delay:640ms');
  for(var k=0;k<4;k++) put(lip,'','','','i');

  var mid=box(fx);
  put(mid,'loveT','--c:'+c.acd+';bottom:34px;left:50%;transform:translateX(-50%);animation-delay:980ms','More Love');
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
  var s=w/312, sh=548*s;
  stage.style.width='312px';
  stage.style.height='548px';
  stage.style.transform='scale('+s.toFixed(4)+')';
  stage.style.left=Math.max(0,(w-312*s)/2).toFixed(1)+'px';
  stage.style.top=Math.max(0,(h-sh)/2).toFixed(1)+'px';
  /* 全屏层要向外延伸多少：舞台居中后，上下各留的空白换算成「设计稿像素」 */
  var bleed=Math.max(0,(h-sh)/2)/s;
  layer.style.setProperty('--bleed', bleed.toFixed(1)+'px');
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
