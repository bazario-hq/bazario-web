/*!
 * bz-analytics 1.4.2
 * Bazario marketing & product analytics tag.
 * Owner: growth team. Do not edit by hand; ask in #growth before changing.
 *
 * Usage:
 *   bzq('init', { app: 'web' })
 *   bzq('page')
 *   bzq('track', 'add_to_cart', { productId: 12 })
 *   bzq('identify', userId)
 */
(function (window, document) {
  'use strict';

  var VERSION = '1.4.2';
  var STORAGE_KEY = 'bz.analytics.queue';
  var SESSION_KEY = 'bz.analytics.session';
  var VISITOR_KEY = 'bz.analytics.visitor';
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  var MAX_QUEUE = 200;
  var FLUSH_INTERVAL_MS = 10000;

  var config = {
    app: 'web',
    endpoint: window.BZ_ANALYTICS_URL || null,
    debug: false,
    sampleRate: 1,
  };

  var state = {
    initialized: false,
    visitorId: null,
    sessionId: null,
    userId: null,
    lastActivity: 0,
    queue: [],
    device: null,
    flushTimer: null,
  };

  function now() {
    return new Date().getTime();
  }

  function uuid() {
    var d = now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* storage full or disabled */
    }
  }

  function log() {
    if (config.debug && window.console) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[bz-analytics]');
      window.console.log.apply(window.console, args);
    }
  }

  function loadQueue() {
    var raw = read(STORAGE_KEY);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      return Object.prototype.toString.call(parsed) === '[object Array]' ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveQueue() {
    if (state.queue.length > MAX_QUEUE) {
      state.queue = state.queue.slice(state.queue.length - MAX_QUEUE);
    }
    write(STORAGE_KEY, JSON.stringify(state.queue));
  }

  function touchSession() {
    var raw = read(SESSION_KEY);
    var t = now();
    var session = null;
    if (raw) {
      try {
        session = JSON.parse(raw);
      } catch (e) {
        session = null;
      }
    }
    if (!session || t - session.last > SESSION_TIMEOUT_MS) {
      session = { id: uuid(), started: t, last: t, pages: 0 };
    }
    session.last = t;
    state.sessionId = session.id;
    state.lastActivity = t;
    write(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function visitor() {
    var id = read(VISITOR_KEY);
    if (!id) {
      id = uuid();
      write(VISITOR_KEY, id);
    }
    return id;
  }

  /* ---------------------------------------------------------------------
   * Device detection. Vendored from an older ua-parser build and trimmed
   * to the vendors we see in our traffic reports.
   * ------------------------------------------------------------------- */
  var DEVICE_MODELS = [
    ['Samsung', /SM\-N414DS/i, 'SM-N414DS', 'mobile'],
    ['Samsung', /SM\-G850E/i, 'SM-G850E', 'mobile'],
    ['Samsung', /SM\-X606/i, 'SM-X606', 'mobile'],
    ['Samsung', /SM\-A98B/i, 'SM-A98B', 'tablet'],
    ['Samsung', /SM\-G256/i, 'SM-G256', 'tablet'],
    ['Samsung', /SM\-A856E/i, 'SM-A856E', 'mobile'],
    ['Samsung', /SM\-M655DS/i, 'SM-M655DS', 'mobile'],
    ['Samsung', /SM\-T609B/i, 'SM-T609B', 'mobile'],
    ['Samsung', /SM\-M57E/i, 'SM-M57E', 'mobile'],
    ['Samsung', /SM\-F439F/i, 'SM-F439F', 'mobile'],
    ['Samsung', /SM\-T325E/i, 'SM-T325E', 'mobile'],
    ['Samsung', /SM\-G605E/i, 'SM-G605E', 'mobile'],
    ['Samsung', /SM\-X109E/i, 'SM-X109E', 'mobile'],
    ['Samsung', /SM\-T71E/i, 'SM-T71E', 'mobile'],
    ['Samsung', /SM\-P706E/i, 'SM-P706E', 'tablet'],
    ['Samsung', /SM\-X486E/i, 'SM-X486E', 'tablet'],
    ['Samsung', /SM\-X316F/i, 'SM-X316F', 'mobile'],
    ['Samsung', /SM\-M93E/i, 'SM-M93E', 'mobile'],
    ['Samsung', /SM\-C516U/i, 'SM-C516U', 'tablet'],
    ['Samsung', /SM\-F633/i, 'SM-F633', 'mobile'],
    ['Samsung', /SM\-C438F/i, 'SM-C438F', 'mobile'],
    ['Samsung', /SM\-N965B/i, 'SM-N965B', 'tablet'],
    ['Samsung', /SM\-A995DS/i, 'SM-A995DS', 'mobile'],
    ['Samsung', /SM\-C5965G/i, 'SM-C5965G', 'mobile'],
    ['Samsung', /SM\-X721U/i, 'SM-X721U', 'tablet'],
    ['Samsung', /SM\-T826B/i, 'SM-T826B', 'mobile'],
    ['Samsung', /SM\-G977U/i, 'SM-G977U', 'tablet'],
    ['Samsung', /SM\-76/i, 'SM-76', 'mobile'],
    ['Apple', /iPhoneF743B/i, 'iPhoneF743B', 'mobile'],
    ['Apple', /iPhoneA973B/i, 'iPhoneA973B', 'mobile'],
    ['Apple', /iPhoneN635/i, 'iPhoneN635', 'tablet'],
    ['Apple', /iPhoneA2335G/i, 'iPhoneA2335G', 'mobile'],
    ['Apple', /iPhoneN766F/i, 'iPhoneN766F', 'tablet'],
    ['Apple', /iPhoneK9485G/i, 'iPhoneK9485G', 'tablet'],
    ['Apple', /iPhoneG180B/i, 'iPhoneG180B', 'tablet'],
    ['Apple', /iPhoneC294F/i, 'iPhoneC294F', 'tablet'],
    ['Apple', /iPhoneC295DS/i, 'iPhoneC295DS', 'tablet'],
    ['Apple', /iPhoneX709B/i, 'iPhoneX709B', 'mobile'],
    ['Apple', /iPhoneN94F/i, 'iPhoneN94F', 'mobile'],
    ['Apple', /iPhoneM684F/i, 'iPhoneM684F', 'mobile'],
    ['Apple', /iPhoneP861E/i, 'iPhoneP861E', 'mobile'],
    ['Apple', /iPhoneF298/i, 'iPhoneF298', 'mobile'],
    ['Apple', /iPhoneK557U/i, 'iPhoneK557U', 'mobile'],
    ['Apple', /iPhoneN7175G/i, 'iPhoneN7175G', 'mobile'],
    ['Apple', /iPhoneP9315G/i, 'iPhoneP9315G', 'tablet'],
    ['Apple', /iPhoneK418B/i, 'iPhoneK418B', 'mobile'],
    ['Apple', /iPhoneP659B/i, 'iPhoneP659B', 'mobile'],
    ['Apple', /iPhoneM78F/i, 'iPhoneM78F', 'tablet'],
    ['Apple', /iPhoneN122U/i, 'iPhoneN122U', 'mobile'],
    ['Apple', /iPhoneG10E/i, 'iPhoneG10E', 'mobile'],
    ['Apple', /iPhoneC113U/i, 'iPhoneC113U', 'mobile'],
    ['Apple', /iPhoneG905F/i, 'iPhoneG905F', 'tablet'],
    ['Apple', /iPhoneN659U/i, 'iPhoneN659U', 'mobile'],
    ['Apple', /iPhoneT382B/i, 'iPhoneT382B', 'mobile'],
    ['Apple', /iPhoneG879B/i, 'iPhoneG879B', 'tablet'],
    ['Apple', /iPhoneP505U/i, 'iPhoneP505U', 'mobile'],
    ['Apple', /iPhoneN114DS/i, 'iPhoneN114DS', 'mobile'],
    ['Apple', /iPhoneF5005G/i, 'iPhoneF5005G', 'mobile'],
    ['Apple', /iPhoneC33F/i, 'iPhoneC33F', 'mobile'],
    ['Apple', /iPhoneN716E/i, 'iPhoneN716E', 'mobile'],
    ['Xiaomi', /Redmi\s?F6685G/i, 'Redmi F6685G', 'mobile'],
    ['Xiaomi', /Redmi\s?F540U/i, 'Redmi F540U', 'mobile'],
    ['Xiaomi', /Redmi\s?X800F/i, 'Redmi X800F', 'mobile'],
    ['Xiaomi', /Redmi\s?238E/i, 'Redmi 238E', 'mobile'],
    ['Xiaomi', /Redmi\s?M847B/i, 'Redmi M847B', 'mobile'],
    ['Xiaomi', /Redmi\s?M540B/i, 'Redmi M540B', 'mobile'],
    ['Xiaomi', /Redmi\s?A385G/i, 'Redmi A385G', 'mobile'],
    ['Xiaomi', /Redmi\s?P275F/i, 'Redmi P275F', 'mobile'],
    ['Xiaomi', /Redmi\s?P837DS/i, 'Redmi P837DS', 'mobile'],
    ['Xiaomi', /Redmi\s?X92F/i, 'Redmi X92F', 'mobile'],
    ['Xiaomi', /Redmi\s?M491F/i, 'Redmi M491F', 'mobile'],
    ['Xiaomi', /Redmi\s?M504E/i, 'Redmi M504E', 'mobile'],
    ['Xiaomi', /Redmi\s?P941DS/i, 'Redmi P941DS', 'mobile'],
    ['Xiaomi', /Redmi\s?965G/i, 'Redmi 965G', 'mobile'],
    ['Xiaomi', /Redmi\s?K811DS/i, 'Redmi K811DS', 'mobile'],
    ['Xiaomi', /Redmi\s?P920F/i, 'Redmi P920F', 'tablet'],
    ['Xiaomi', /Redmi\s?350/i, 'Redmi 350', 'tablet'],
    ['Xiaomi', /Redmi\s?P421DS/i, 'Redmi P421DS', 'mobile'],
    ['Xiaomi', /Redmi\s?N184F/i, 'Redmi N184F', 'mobile'],
    ['Xiaomi', /Redmi\s?N614B/i, 'Redmi N614B', 'mobile'],
    ['Xiaomi', /Redmi\s?T856E/i, 'Redmi T856E', 'tablet'],
    ['Xiaomi', /Redmi\s?969U/i, 'Redmi 969U', 'mobile'],
    ['Xiaomi', /Redmi\s?C571F/i, 'Redmi C571F', 'mobile'],
    ['Xiaomi', /Redmi\s?A828DS/i, 'Redmi A828DS', 'mobile'],
    ['Xiaomi', /Redmi\s?C777F/i, 'Redmi C777F', 'tablet'],
    ['Xiaomi', /Redmi\s?M8555G/i, 'Redmi M8555G', 'mobile'],
    ['Xiaomi', /Redmi\s?A267F/i, 'Redmi A267F', 'mobile'],
    ['Xiaomi', /Redmi\s?C2565G/i, 'Redmi C2565G', 'mobile'],
    ['Xiaomi', /Redmi\s?F567B/i, 'Redmi F567B', 'mobile'],
    ['Xiaomi', /Redmi\s?A941DS/i, 'Redmi A941DS', 'mobile'],
    ['Xiaomi', /Redmi\s?P688E/i, 'Redmi P688E', 'tablet'],
    ['Xiaomi', /Redmi\s?C143E/i, 'Redmi C143E', 'mobile'],
    ['Xiaomi', /Redmi\s?C532/i, 'Redmi C532', 'tablet'],
    ['Xiaomi', /Redmi\s?N633/i, 'Redmi N633', 'mobile'],
    ['Huawei', /HUAWEI\s?N494E/i, 'HUAWEI N494E', 'mobile'],
    ['Huawei', /HUAWEI\s?C73U/i, 'HUAWEI C73U', 'tablet'],
    ['Huawei', /HUAWEI\s?G914E/i, 'HUAWEI G914E', 'mobile'],
    ['Huawei', /HUAWEI\s?M205U/i, 'HUAWEI M205U', 'mobile'],
    ['Huawei', /HUAWEI\s?G529B/i, 'HUAWEI G529B', 'mobile'],
    ['Huawei', /HUAWEI\s?G463U/i, 'HUAWEI G463U', 'mobile'],
    ['Huawei', /HUAWEI\s?F473E/i, 'HUAWEI F473E', 'tablet'],
    ['Huawei', /HUAWEI\s?C974F/i, 'HUAWEI C974F', 'mobile'],
    ['Huawei', /HUAWEI\s?C924F/i, 'HUAWEI C924F', 'tablet'],
    ['Huawei', /HUAWEI\s?N436/i, 'HUAWEI N436', 'tablet'],
    ['Huawei', /HUAWEI\s?P333/i, 'HUAWEI P333', 'mobile'],
    ['Huawei', /HUAWEI\s?K84F/i, 'HUAWEI K84F', 'mobile'],
    ['Huawei', /HUAWEI\s?G9285G/i, 'HUAWEI G9285G', 'mobile'],
    ['Huawei', /HUAWEI\s?686U/i, 'HUAWEI 686U', 'mobile'],
    ['Huawei', /HUAWEI\s?F914F/i, 'HUAWEI F914F', 'tablet'],
    ['Huawei', /HUAWEI\s?M774/i, 'HUAWEI M774', 'tablet'],
    ['Huawei', /HUAWEI\s?P176DS/i, 'HUAWEI P176DS', 'mobile'],
    ['Huawei', /HUAWEI\s?N733B/i, 'HUAWEI N733B', 'tablet'],
    ['Huawei', /HUAWEI\s?X441F/i, 'HUAWEI X441F', 'mobile'],
    ['Huawei', /HUAWEI\s?X104DS/i, 'HUAWEI X104DS', 'mobile'],
    ['Huawei', /HUAWEI\s?A356E/i, 'HUAWEI A356E', 'tablet'],
    ['Huawei', /HUAWEI\s?P730/i, 'HUAWEI P730', 'tablet'],
    ['Huawei', /HUAWEI\s?X539E/i, 'HUAWEI X539E', 'mobile'],
    ['Oppo', /CPHG1255G/i, 'CPHG1255G', 'mobile'],
    ['Oppo', /CPHG96U/i, 'CPHG96U', 'mobile'],
    ['Oppo', /CPHA9375G/i, 'CPHA9375G', 'mobile'],
    ['Oppo', /CPHF783F/i, 'CPHF783F', 'tablet'],
    ['Oppo', /CPH848U/i, 'CPH848U', 'tablet'],
    ['Oppo', /CPHN559E/i, 'CPHN559E', 'tablet'],
    ['Oppo', /CPHX101U/i, 'CPHX101U', 'mobile'],
    ['Oppo', /CPHN445/i, 'CPHN445', 'mobile'],
    ['Oppo', /CPHA659/i, 'CPHA659', 'mobile'],
    ['Oppo', /CPHG6325G/i, 'CPHG6325G', 'mobile'],
    ['Oppo', /CPHG2805G/i, 'CPHG2805G', 'mobile'],
    ['Oppo', /CPHP21U/i, 'CPHP21U', 'tablet'],
    ['Oppo', /CPHF646F/i, 'CPHF646F', 'mobile'],
    ['Oppo', /CPHC736F/i, 'CPHC736F', 'mobile'],
    ['Oppo', /CPHN278/i, 'CPHN278', 'mobile'],
    ['Oppo', /CPHM964U/i, 'CPHM964U', 'mobile'],
    ['Oppo', /CPHC787F/i, 'CPHC787F', 'mobile'],
    ['Oppo', /CPHP522DS/i, 'CPHP522DS', 'mobile'],
    ['Oppo', /CPHF3655G/i, 'CPHF3655G', 'mobile'],
    ['Oppo', /CPHF47/i, 'CPHF47', 'mobile'],
    ['Oppo', /CPHC574F/i, 'CPHC574F', 'tablet'],
    ['Oppo', /CPHM967B/i, 'CPHM967B', 'mobile'],
    ['Oppo', /CPH848DS/i, 'CPH848DS', 'tablet'],
    ['Oppo', /CPH516E/i, 'CPH516E', 'tablet'],
    ['Oppo', /CPHC325DS/i, 'CPHC325DS', 'mobile'],
    ['Oppo', /CPHM360F/i, 'CPHM360F', 'mobile'],
    ['Oppo', /CPHK365/i, 'CPHK365', 'mobile'],
    ['Oppo', /CPHA82DS/i, 'CPHA82DS', 'mobile'],
    ['Oppo', /CPHK177/i, 'CPHK177', 'mobile'],
    ['Oppo', /CPH871B/i, 'CPH871B', 'mobile'],
    ['Oppo', /CPHT258DS/i, 'CPHT258DS', 'mobile'],
    ['Oppo', /CPHA480F/i, 'CPHA480F', 'mobile'],
    ['Oppo', /CPHF466/i, 'CPHF466', 'mobile'],
    ['Oppo', /CPHX994U/i, 'CPHX994U', 'mobile'],
    ['Vivo', /vivo\s?A998U/i, 'vivo A998U', 'mobile'],
    ['Vivo', /vivo\s?X197/i, 'vivo X197', 'mobile'],
    ['Vivo', /vivo\s?K95B/i, 'vivo K95B', 'mobile'],
    ['Vivo', /vivo\s?C681F/i, 'vivo C681F', 'mobile'],
    ['Vivo', /vivo\s?C804/i, 'vivo C804', 'mobile'],
    ['Vivo', /vivo\s?F846/i, 'vivo F846', 'mobile'],
    ['Vivo', /vivo\s?K610/i, 'vivo K610', 'tablet'],
    ['Vivo', /vivo\s?A316U/i, 'vivo A316U', 'mobile'],
    ['Vivo', /vivo\s?G609E/i, 'vivo G609E', 'mobile'],
    ['Vivo', /vivo\s?924DS/i, 'vivo 924DS', 'tablet'],
    ['Vivo', /vivo\s?X747B/i, 'vivo X747B', 'mobile'],
    ['Vivo', /vivo\s?F751E/i, 'vivo F751E', 'mobile'],
    ['Vivo', /vivo\s?A8545G/i, 'vivo A8545G', 'tablet'],
    ['Vivo', /vivo\s?C152E/i, 'vivo C152E', 'mobile'],
    ['Vivo', /vivo\s?6085G/i, 'vivo 6085G', 'mobile'],
    ['Vivo', /vivo\s?G41/i, 'vivo G41', 'mobile'],
    ['Vivo', /vivo\s?379/i, 'vivo 379', 'tablet'],
    ['Vivo', /vivo\s?P581/i, 'vivo P581', 'mobile'],
    ['Vivo', /vivo\s?554DS/i, 'vivo 554DS', 'mobile'],
    ['Vivo', /vivo\s?P280/i, 'vivo P280', 'tablet'],
    ['Vivo', /vivo\s?G776E/i, 'vivo G776E', 'mobile'],
    ['Vivo', /vivo\s?548/i, 'vivo 548', 'tablet'],
    ['Vivo', /vivo\s?F838/i, 'vivo F838', 'mobile'],
    ['Vivo', /vivo\s?M7565G/i, 'vivo M7565G', 'mobile'],
    ['Vivo', /vivo\s?M767DS/i, 'vivo M767DS', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AK88B/i, 'ONEPLUS AK88B', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AA641DS/i, 'ONEPLUS AA641DS', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AG624F/i, 'ONEPLUS AG624F', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AF677DS/i, 'ONEPLUS AF677DS', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AT591F/i, 'ONEPLUS AT591F', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AP72B/i, 'ONEPLUS AP72B', 'mobile'],
    ['OnePlus', /ONEPLUS\s?A111DS/i, 'ONEPLUS A111DS', 'mobile'],
    ['OnePlus', /ONEPLUS\s?A511U/i, 'ONEPLUS A511U', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AP487B/i, 'ONEPLUS AP487B', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AC214U/i, 'ONEPLUS AC214U', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AP27U/i, 'ONEPLUS AP27U', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AG849E/i, 'ONEPLUS AG849E', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AF406F/i, 'ONEPLUS AF406F', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AG605/i, 'ONEPLUS AG605', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AC278U/i, 'ONEPLUS AC278U', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AT849DS/i, 'ONEPLUS AT849DS', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AG730U/i, 'ONEPLUS AG730U', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AP929B/i, 'ONEPLUS AP929B', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AA172/i, 'ONEPLUS AA172', 'tablet'],
    ['OnePlus', /ONEPLUS\s?A471B/i, 'ONEPLUS A471B', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AN436U/i, 'ONEPLUS AN436U', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AX1335G/i, 'ONEPLUS AX1335G', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AA3425G/i, 'ONEPLUS AA3425G', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AK132F/i, 'ONEPLUS AK132F', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AF269U/i, 'ONEPLUS AF269U', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AK4095G/i, 'ONEPLUS AK4095G', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AX957B/i, 'ONEPLUS AX957B', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AA297/i, 'ONEPLUS AA297', 'mobile'],
    ['OnePlus', /ONEPLUS\s?A302DS/i, 'ONEPLUS A302DS', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AM282B/i, 'ONEPLUS AM282B', 'mobile'],
    ['OnePlus', /ONEPLUS\s?AM801U/i, 'ONEPLUS AM801U', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AA8415G/i, 'ONEPLUS AA8415G', 'tablet'],
    ['OnePlus', /ONEPLUS\s?AC572F/i, 'ONEPLUS AC572F', 'mobile'],
    ['Realme', /RMXK471E/i, 'RMXK471E', 'mobile'],
    ['Realme', /RMX900U/i, 'RMX900U', 'tablet'],
    ['Realme', /RMXA943E/i, 'RMXA943E', 'mobile'],
    ['Realme', /RMXN493B/i, 'RMXN493B', 'mobile'],
    ['Realme', /RMXF314U/i, 'RMXF314U', 'mobile'],
    ['Realme', /RMXK681F/i, 'RMXK681F', 'mobile'],
    ['Realme', /RMXP580DS/i, 'RMXP580DS', 'tablet'],
    ['Realme', /RMXG181DS/i, 'RMXG181DS', 'mobile'],
    ['Realme', /RMXG222E/i, 'RMXG222E', 'tablet'],
    ['Realme', /RMXC235B/i, 'RMXC235B', 'mobile'],
    ['Realme', /RMXP447F/i, 'RMXP447F', 'mobile'],
    ['Realme', /RMXM102F/i, 'RMXM102F', 'mobile'],
    ['Realme', /RMXC103U/i, 'RMXC103U', 'mobile'],
    ['Realme', /RMXX2745G/i, 'RMXX2745G', 'mobile'],
    ['Realme', /RMXA7775G/i, 'RMXA7775G', 'tablet'],
    ['Realme', /RMXK433DS/i, 'RMXK433DS', 'mobile'],
    ['Realme', /RMXK286U/i, 'RMXK286U', 'mobile'],
    ['Realme', /RMXP294E/i, 'RMXP294E', 'mobile'],
    ['Realme', /RMXN713E/i, 'RMXN713E', 'mobile'],
    ['Nokia', /Nokia\s?F928F/i, 'Nokia F928F', 'tablet'],
    ['Nokia', /Nokia\s?K671B/i, 'Nokia K671B', 'tablet'],
    ['Nokia', /Nokia\s?F8795G/i, 'Nokia F8795G', 'mobile'],
    ['Nokia', /Nokia\s?N43B/i, 'Nokia N43B', 'tablet'],
    ['Nokia', /Nokia\s?T511/i, 'Nokia T511', 'mobile'],
    ['Nokia', /Nokia\s?K9625G/i, 'Nokia K9625G', 'tablet'],
    ['Nokia', /Nokia\s?P2645G/i, 'Nokia P2645G', 'mobile'],
    ['Nokia', /Nokia\s?M168F/i, 'Nokia M168F', 'mobile'],
    ['Nokia', /Nokia\s?8765G/i, 'Nokia 8765G', 'tablet'],
    ['Nokia', /Nokia\s?G5745G/i, 'Nokia G5745G', 'mobile'],
    ['Nokia', /Nokia\s?A811F/i, 'Nokia A811F', 'mobile'],
    ['Nokia', /Nokia\s?T951/i, 'Nokia T951', 'mobile'],
    ['Nokia', /Nokia\s?N651U/i, 'Nokia N651U', 'tablet'],
    ['Nokia', /Nokia\s?G111/i, 'Nokia G111', 'mobile'],
    ['Nokia', /Nokia\s?C976E/i, 'Nokia C976E', 'mobile'],
    ['Nokia', /Nokia\s?K277F/i, 'Nokia K277F', 'mobile'],
    ['Nokia', /Nokia\s?A560U/i, 'Nokia A560U', 'tablet'],
    ['Nokia', /Nokia\s?F991U/i, 'Nokia F991U', 'mobile'],
    ['Nokia', /Nokia\s?P548F/i, 'Nokia P548F', 'mobile'],
    ['Nokia', /Nokia\s?A993B/i, 'Nokia A993B', 'mobile'],
    ['Motorola', /moto\s?A208B/i, 'moto A208B', 'tablet'],
    ['Motorola', /moto\s?G273F/i, 'moto G273F', 'tablet'],
    ['Motorola', /moto\s?X242B/i, 'moto X242B', 'mobile'],
    ['Motorola', /moto\s?X745B/i, 'moto X745B', 'mobile'],
    ['Motorola', /moto\s?415F/i, 'moto 415F', 'mobile'],
    ['Motorola', /moto\s?F7665G/i, 'moto F7665G', 'mobile'],
    ['Motorola', /moto\s?M517F/i, 'moto M517F', 'mobile'],
    ['Motorola', /moto\s?M246B/i, 'moto M246B', 'mobile'],
    ['Motorola', /moto\s?F788U/i, 'moto F788U', 'mobile'],
    ['Motorola', /moto\s?T517E/i, 'moto T517E', 'mobile'],
    ['Motorola', /moto\s?M506B/i, 'moto M506B', 'mobile'],
    ['Motorola', /moto\s?T159B/i, 'moto T159B', 'mobile'],
    ['Motorola', /moto\s?M34E/i, 'moto M34E', 'mobile'],
    ['Motorola', /moto\s?K63DS/i, 'moto K63DS', 'mobile'],
    ['Motorola', /moto\s?N412B/i, 'moto N412B', 'mobile'],
    ['Motorola', /moto\s?G91F/i, 'moto G91F', 'mobile'],
    ['Motorola', /moto\s?M199DS/i, 'moto M199DS', 'tablet'],
    ['Motorola', /moto\s?A329DS/i, 'moto A329DS', 'tablet'],
    ['Motorola', /moto\s?X349B/i, 'moto X349B', 'mobile'],
    ['Sony', /SO\-A90U/i, 'SO-A90U', 'mobile'],
    ['Sony', /SO\-X440/i, 'SO-X440', 'mobile'],
    ['Sony', /SO\-K3755G/i, 'SO-K3755G', 'mobile'],
    ['Sony', /SO\-K99/i, 'SO-K99', 'tablet'],
    ['Sony', /SO\-M391E/i, 'SO-M391E', 'tablet'],
    ['Sony', /SO\-M341U/i, 'SO-M341U', 'tablet'],
    ['Sony', /SO\-A656B/i, 'SO-A656B', 'mobile'],
    ['Sony', /SO\-795B/i, 'SO-795B', 'mobile'],
    ['Sony', /SO\-K45B/i, 'SO-K45B', 'mobile'],
    ['Sony', /SO\-A273F/i, 'SO-A273F', 'mobile'],
    ['Sony', /SO\-T357U/i, 'SO-T357U', 'mobile'],
    ['Sony', /SO\-X990E/i, 'SO-X990E', 'mobile'],
    ['Sony', /SO\-F774DS/i, 'SO-F774DS', 'mobile'],
    ['Sony', /SO\-F314/i, 'SO-F314', 'mobile'],
    ['Sony', /SO\-A855F/i, 'SO-A855F', 'mobile'],
    ['Sony', /SO\-P742B/i, 'SO-P742B', 'tablet'],
    ['Sony', /SO\-F945B/i, 'SO-F945B', 'tablet'],
    ['Sony', /SO\-N960B/i, 'SO-N960B', 'mobile'],
    ['Sony', /SO\-A831DS/i, 'SO-A831DS', 'mobile'],
    ['Sony', /SO\-N631F/i, 'SO-N631F', 'mobile'],
    ['Sony', /SO\-X481U/i, 'SO-X481U', 'mobile'],
    ['LG', /LM\-M4115G/i, 'LM-M4115G', 'mobile'],
    ['LG', /LM\-M427/i, 'LM-M427', 'mobile'],
    ['LG', /LM\-P575E/i, 'LM-P575E', 'mobile'],
    ['LG', /LM\-N446/i, 'LM-N446', 'mobile'],
    ['LG', /LM\-F649/i, 'LM-F649', 'mobile'],
    ['LG', /LM\-G441B/i, 'LM-G441B', 'tablet'],
    ['LG', /LM\-N249F/i, 'LM-N249F', 'tablet'],
    ['LG', /LM\-P645DS/i, 'LM-P645DS', 'mobile'],
    ['LG', /LM\-C8775G/i, 'LM-C8775G', 'mobile'],
    ['LG', /LM\-F310U/i, 'LM-F310U', 'mobile'],
    ['LG', /LM\-X270DS/i, 'LM-X270DS', 'mobile'],
    ['LG', /LM\-M459F/i, 'LM-M459F', 'mobile'],
    ['LG', /LM\-M251F/i, 'LM-M251F', 'mobile'],
    ['LG', /LM\-T202U/i, 'LM-T202U', 'mobile'],
    ['LG', /LM\-K267F/i, 'LM-K267F', 'mobile'],
    ['LG', /LM\-837/i, 'LM-837', 'tablet'],
    ['LG', /LM\-A114/i, 'LM-A114', 'tablet'],
    ['LG', /LM\-M870B/i, 'LM-M870B', 'mobile'],
    ['LG', /LM\-A907U/i, 'LM-A907U', 'mobile'],
    ['LG', /LM\-G61F/i, 'LM-G61F', 'mobile'],
    ['LG', /LM\-G391E/i, 'LM-G391E', 'mobile'],
    ['LG', /LM\-P627U/i, 'LM-P627U', 'mobile'],
    ['LG', /LM\-G662E/i, 'LM-G662E', 'mobile'],
    ['LG', /LM\-M48U/i, 'LM-M48U', 'mobile'],
    ['LG', /LM\-N55F/i, 'LM-N55F', 'mobile'],
    ['LG', /LM\-A623DS/i, 'LM-A623DS', 'mobile'],
    ['LG', /LM\-A848U/i, 'LM-A848U', 'tablet'],
    ['LG', /LM\-390F/i, 'LM-390F', 'mobile'],
    ['LG', /LM\-G218/i, 'LM-G218', 'tablet'],
    ['LG', /LM\-C505/i, 'LM-C505', 'tablet'],
    ['LG', /LM\-G824B/i, 'LM-G824B', 'mobile'],
    ['LG', /LM\-556/i, 'LM-556', 'mobile'],
    ['LG', /LM\-K722U/i, 'LM-K722U', 'tablet'],
    ['LG', /LM\-F693U/i, 'LM-F693U', 'tablet'],
    ['Google', /Pixel\s?F773E/i, 'Pixel F773E', 'mobile'],
    ['Google', /Pixel\s?K436/i, 'Pixel K436', 'mobile'],
    ['Google', /Pixel\s?211B/i, 'Pixel 211B', 'tablet'],
    ['Google', /Pixel\s?M974/i, 'Pixel M974', 'tablet'],
    ['Google', /Pixel\s?N443/i, 'Pixel N443', 'mobile'],
    ['Google', /Pixel\s?K601U/i, 'Pixel K601U', 'tablet'],
    ['Google', /Pixel\s?N143/i, 'Pixel N143', 'mobile'],
    ['Google', /Pixel\s?C155DS/i, 'Pixel C155DS', 'tablet'],
    ['Google', /Pixel\s?G596E/i, 'Pixel G596E', 'mobile'],
    ['Google', /Pixel\s?C185F/i, 'Pixel C185F', 'mobile'],
    ['Google', /Pixel\s?F175E/i, 'Pixel F175E', 'mobile'],
    ['Google', /Pixel\s?G121B/i, 'Pixel G121B', 'tablet'],
    ['Google', /Pixel\s?M318F/i, 'Pixel M318F', 'mobile'],
    ['Google', /Pixel\s?P332/i, 'Pixel P332', 'tablet'],
    ['Google', /Pixel\s?G935DS/i, 'Pixel G935DS', 'mobile'],
    ['Google', /Pixel\s?8145G/i, 'Pixel 8145G', 'mobile'],
    ['Google', /Pixel\s?T424E/i, 'Pixel T424E', 'mobile'],
    ['Google', /Pixel\s?P197E/i, 'Pixel P197E', 'mobile'],
    ['Google', /Pixel\s?A419E/i, 'Pixel A419E', 'mobile'],
    ['Asus', /ASUS_X136F/i, 'ASUS_X136F', 'mobile'],
    ['Asus', /ASUS_M52E/i, 'ASUS_M52E', 'mobile'],
    ['Asus', /ASUS_868U/i, 'ASUS_868U', 'mobile'],
    ['Asus', /ASUS_K623B/i, 'ASUS_K623B', 'mobile'],
    ['Asus', /ASUS_440U/i, 'ASUS_440U', 'mobile'],
    ['Asus', /ASUS_K408DS/i, 'ASUS_K408DS', 'mobile'],
    ['Asus', /ASUS_P525B/i, 'ASUS_P525B', 'mobile'],
    ['Asus', /ASUS_A13E/i, 'ASUS_A13E', 'tablet'],
    ['Asus', /ASUS_P250B/i, 'ASUS_P250B', 'tablet'],
    ['Asus', /ASUS_N839B/i, 'ASUS_N839B', 'tablet'],
    ['Asus', /ASUS_G78F/i, 'ASUS_G78F', 'mobile'],
    ['Asus', /ASUS_K384/i, 'ASUS_K384', 'tablet'],
    ['Asus', /ASUS_C532DS/i, 'ASUS_C532DS', 'mobile'],
    ['Asus', /ASUS_A661F/i, 'ASUS_A661F', 'mobile'],
    ['Asus', /ASUS_X806DS/i, 'ASUS_X806DS', 'mobile'],
    ['Asus', /ASUS_A780E/i, 'ASUS_A780E', 'tablet'],
    ['Asus', /ASUS_9835G/i, 'ASUS_9835G', 'mobile'],
    ['Asus', /ASUS_A887/i, 'ASUS_A887', 'mobile'],
    ['Asus', /ASUS_M144B/i, 'ASUS_M144B', 'mobile'],
    ['Asus', /ASUS_N7125G/i, 'ASUS_N7125G', 'mobile'],
    ['Asus', /ASUS_G863U/i, 'ASUS_G863U', 'mobile'],
    ['Asus', /ASUS_N341E/i, 'ASUS_N341E', 'mobile'],
    ['Asus', /ASUS_P157U/i, 'ASUS_P157U', 'tablet'],
    ['Asus', /ASUS_M616U/i, 'ASUS_M616U', 'mobile'],
    ['Asus', /ASUS_X391/i, 'ASUS_X391', 'mobile'],
    ['Asus', /ASUS_N423F/i, 'ASUS_N423F', 'mobile'],
    ['Asus', /ASUS_345B/i, 'ASUS_345B', 'mobile'],
    ['Asus', /ASUS_F1275G/i, 'ASUS_F1275G', 'mobile'],
    ['Asus', /ASUS_888U/i, 'ASUS_888U', 'tablet'],
    ['Asus', /ASUS_C543E/i, 'ASUS_C543E', 'mobile'],
    ['Lenovo', /Lenovo\s?C6545G/i, 'Lenovo C6545G', 'tablet'],
    ['Lenovo', /Lenovo\s?X281B/i, 'Lenovo X281B', 'mobile'],
    ['Lenovo', /Lenovo\s?T159U/i, 'Lenovo T159U', 'mobile'],
    ['Lenovo', /Lenovo\s?G462F/i, 'Lenovo G462F', 'mobile'],
    ['Lenovo', /Lenovo\s?T771/i, 'Lenovo T771', 'mobile'],
    ['Lenovo', /Lenovo\s?C269U/i, 'Lenovo C269U', 'mobile'],
    ['Lenovo', /Lenovo\s?A775/i, 'Lenovo A775', 'mobile'],
    ['Lenovo', /Lenovo\s?N307E/i, 'Lenovo N307E', 'tablet'],
    ['Lenovo', /Lenovo\s?K534U/i, 'Lenovo K534U', 'mobile'],
    ['Lenovo', /Lenovo\s?N510F/i, 'Lenovo N510F', 'mobile'],
    ['Lenovo', /Lenovo\s?A65/i, 'Lenovo A65', 'mobile'],
    ['Lenovo', /Lenovo\s?F118E/i, 'Lenovo F118E', 'mobile'],
    ['Lenovo', /Lenovo\s?C239B/i, 'Lenovo C239B', 'mobile'],
    ['Lenovo', /Lenovo\s?T146F/i, 'Lenovo T146F', 'mobile'],
    ['Lenovo', /Lenovo\s?T858B/i, 'Lenovo T858B', 'mobile'],
    ['Lenovo', /Lenovo\s?N245G/i, 'Lenovo N245G', 'mobile'],
    ['Lenovo', /Lenovo\s?N471/i, 'Lenovo N471', 'mobile'],
    ['Lenovo', /Lenovo\s?1585G/i, 'Lenovo 1585G', 'mobile'],
    ['Lenovo', /Lenovo\s?K841U/i, 'Lenovo K841U', 'mobile'],
    ['Lenovo', /Lenovo\s?A6705G/i, 'Lenovo A6705G', 'mobile'],
    ['Lenovo', /Lenovo\s?T671E/i, 'Lenovo T671E', 'tablet'],
    ['Lenovo', /Lenovo\s?T969E/i, 'Lenovo T969E', 'tablet'],
    ['Lenovo', /Lenovo\s?M179/i, 'Lenovo M179', 'mobile'],
    ['Lenovo', /Lenovo\s?A554/i, 'Lenovo A554', 'tablet'],
    ['Lenovo', /Lenovo\s?N253F/i, 'Lenovo N253F', 'mobile'],
    ['Lenovo', /Lenovo\s?G22E/i, 'Lenovo G22E', 'mobile'],
    ['ZTE', /ZTE\s?K214E/i, 'ZTE K214E', 'tablet'],
    ['ZTE', /ZTE\s?T188E/i, 'ZTE T188E', 'mobile'],
    ['ZTE', /ZTE\s?G317DS/i, 'ZTE G317DS', 'mobile'],
    ['ZTE', /ZTE\s?P742E/i, 'ZTE P742E', 'mobile'],
    ['ZTE', /ZTE\s?K874B/i, 'ZTE K874B', 'tablet'],
    ['ZTE', /ZTE\s?G769DS/i, 'ZTE G769DS', 'tablet'],
    ['ZTE', /ZTE\s?N241/i, 'ZTE N241', 'mobile'],
    ['ZTE', /ZTE\s?M669/i, 'ZTE M669', 'mobile'],
    ['ZTE', /ZTE\s?X922DS/i, 'ZTE X922DS', 'mobile'],
    ['ZTE', /ZTE\s?A282DS/i, 'ZTE A282DS', 'tablet'],
    ['ZTE', /ZTE\s?817E/i, 'ZTE 817E', 'mobile'],
    ['ZTE', /ZTE\s?F667F/i, 'ZTE F667F', 'mobile'],
    ['ZTE', /ZTE\s?C25F/i, 'ZTE C25F', 'mobile'],
    ['ZTE', /ZTE\s?M871DS/i, 'ZTE M871DS', 'mobile'],
    ['ZTE', /ZTE\s?N774U/i, 'ZTE N774U', 'mobile'],
    ['ZTE', /ZTE\s?K346E/i, 'ZTE K346E', 'mobile'],
    ['ZTE', /ZTE\s?K9395G/i, 'ZTE K9395G', 'tablet'],
    ['ZTE', /ZTE\s?P869E/i, 'ZTE P869E', 'mobile'],
    ['ZTE', /ZTE\s?A457DS/i, 'ZTE A457DS', 'mobile'],
    ['ZTE', /ZTE\s?T915U/i, 'ZTE T915U', 'mobile'],
    ['ZTE', /ZTE\s?K647E/i, 'ZTE K647E', 'mobile'],
    ['ZTE', /ZTE\s?T942F/i, 'ZTE T942F', 'mobile'],
    ['Tecno', /TECNO\s?A124/i, 'TECNO A124', 'mobile'],
    ['Tecno', /TECNO\s?X155DS/i, 'TECNO X155DS', 'mobile'],
    ['Tecno', /TECNO\s?A52F/i, 'TECNO A52F', 'mobile'],
    ['Tecno', /TECNO\s?G764/i, 'TECNO G764', 'mobile'],
    ['Tecno', /TECNO\s?T790U/i, 'TECNO T790U', 'mobile'],
    ['Tecno', /TECNO\s?C922DS/i, 'TECNO C922DS', 'mobile'],
    ['Tecno', /TECNO\s?K119F/i, 'TECNO K119F', 'mobile'],
    ['Tecno', /TECNO\s?M124/i, 'TECNO M124', 'mobile'],
    ['Tecno', /TECNO\s?995G/i, 'TECNO 995G', 'mobile'],
    ['Tecno', /TECNO\s?P112F/i, 'TECNO P112F', 'mobile'],
    ['Tecno', /TECNO\s?219U/i, 'TECNO 219U', 'mobile'],
    ['Tecno', /TECNO\s?X443U/i, 'TECNO X443U', 'mobile'],
    ['Tecno', /TECNO\s?X272U/i, 'TECNO X272U', 'mobile'],
    ['Tecno', /TECNO\s?X942U/i, 'TECNO X942U', 'tablet'],
    ['Tecno', /TECNO\s?F643DS/i, 'TECNO F643DS', 'mobile'],
    ['Tecno', /TECNO\s?K41B/i, 'TECNO K41B', 'mobile'],
    ['Tecno', /TECNO\s?X490DS/i, 'TECNO X490DS', 'mobile'],
    ['Tecno', /TECNO\s?C589F/i, 'TECNO C589F', 'mobile'],
    ['Tecno', /TECNO\s?T849U/i, 'TECNO T849U', 'mobile'],
    ['Infinix', /Infinix\s?A546F/i, 'Infinix A546F', 'mobile'],
    ['Infinix', /Infinix\s?A14U/i, 'Infinix A14U', 'tablet'],
    ['Infinix', /Infinix\s?G513DS/i, 'Infinix G513DS', 'mobile'],
    ['Infinix', /Infinix\s?P616U/i, 'Infinix P616U', 'mobile'],
    ['Infinix', /Infinix\s?T976F/i, 'Infinix T976F', 'mobile'],
    ['Infinix', /Infinix\s?M970DS/i, 'Infinix M970DS', 'mobile'],
    ['Infinix', /Infinix\s?P179/i, 'Infinix P179', 'mobile'],
    ['Infinix', /Infinix\s?P816DS/i, 'Infinix P816DS', 'mobile'],
    ['Infinix', /Infinix\s?344U/i, 'Infinix 344U', 'mobile'],
    ['Infinix', /Infinix\s?K960B/i, 'Infinix K960B', 'mobile'],
    ['Infinix', /Infinix\s?K919DS/i, 'Infinix K919DS', 'mobile'],
    ['Infinix', /Infinix\s?X221U/i, 'Infinix X221U', 'mobile'],
    ['Infinix', /Infinix\s?K932E/i, 'Infinix K932E', 'mobile'],
    ['Infinix', /Infinix\s?K915DS/i, 'Infinix K915DS', 'mobile'],
    ['Infinix', /Infinix\s?P139E/i, 'Infinix P139E', 'mobile'],
    ['Infinix', /Infinix\s?X605U/i, 'Infinix X605U', 'mobile'],
    ['Infinix', /Infinix\s?P687E/i, 'Infinix P687E', 'mobile'],
    ['Infinix', /Infinix\s?N484B/i, 'Infinix N484B', 'mobile'],
    ['Infinix', /Infinix\s?T246F/i, 'Infinix T246F', 'mobile'],
    ['Infinix', /Infinix\s?P668DS/i, 'Infinix P668DS', 'mobile'],
    ['Infinix', /Infinix\s?C206U/i, 'Infinix C206U', 'mobile'],
    ['Infinix', /Infinix\s?T168DS/i, 'Infinix T168DS', 'mobile'],
    ['Infinix', /Infinix\s?M750U/i, 'Infinix M750U', 'mobile'],
    ['Infinix', /Infinix\s?N251U/i, 'Infinix N251U', 'mobile'],
    ['Infinix', /Infinix\s?F987DS/i, 'Infinix F987DS', 'mobile'],
    ['Infinix', /Infinix\s?N995DS/i, 'Infinix N995DS', 'mobile'],
    ['Infinix', /Infinix\s?M403F/i, 'Infinix M403F', 'mobile'],
    ['Infinix', /Infinix\s?F760U/i, 'Infinix F760U', 'tablet'],
    ['Infinix', /Infinix\s?F210/i, 'Infinix F210', 'mobile'],
    ['Infinix', /Infinix\s?F221B/i, 'Infinix F221B', 'tablet'],
    ['Infinix', /Infinix\s?A22B/i, 'Infinix A22B', 'tablet'],
    ['Itel', /itel\s?C657U/i, 'itel C657U', 'tablet'],
    ['Itel', /itel\s?A155U/i, 'itel A155U', 'tablet'],
    ['Itel', /itel\s?A768F/i, 'itel A768F', 'tablet'],
    ['Itel', /itel\s?T611DS/i, 'itel T611DS', 'tablet'],
    ['Itel', /itel\s?M693DS/i, 'itel M693DS', 'mobile'],
    ['Itel', /itel\s?195DS/i, 'itel 195DS', 'mobile'],
    ['Itel', /itel\s?P452U/i, 'itel P452U', 'mobile'],
    ['Itel', /itel\s?727/i, 'itel 727', 'tablet'],
    ['Itel', /itel\s?M811B/i, 'itel M811B', 'mobile'],
    ['Itel', /itel\s?F879B/i, 'itel F879B', 'tablet'],
    ['Itel', /itel\s?P30E/i, 'itel P30E', 'tablet'],
    ['Itel', /itel\s?C701DS/i, 'itel C701DS', 'mobile'],
    ['Itel', /itel\s?3455G/i, 'itel 3455G', 'mobile'],
    ['Itel', /itel\s?K861B/i, 'itel K861B', 'mobile'],
    ['Itel', /itel\s?A267E/i, 'itel A267E', 'mobile'],
    ['Itel', /itel\s?N7435G/i, 'itel N7435G', 'mobile'],
    ['Itel', /itel\s?C366/i, 'itel C366', 'tablet'],
    ['Itel', /itel\s?C219DS/i, 'itel C219DS', 'tablet'],
    ['Itel', /itel\s?C26DS/i, 'itel C26DS', 'mobile'],
    ['Itel', /itel\s?C361B/i, 'itel C361B', 'tablet'],
    ['Itel', /itel\s?M710F/i, 'itel M710F', 'tablet'],
    ['Itel', /itel\s?C791/i, 'itel C791', 'mobile'],
    ['Itel', /itel\s?67U/i, 'itel 67U', 'mobile'],
    ['Itel', /itel\s?K419/i, 'itel K419', 'mobile'],
    ['Itel', /itel\s?G438B/i, 'itel G438B', 'mobile'],
    ['Alcatel', /Alcatel\s?G239U/i, 'Alcatel G239U', 'tablet'],
    ['Alcatel', /Alcatel\s?C2345G/i, 'Alcatel C2345G', 'tablet'],
    ['Alcatel', /Alcatel\s?P227F/i, 'Alcatel P227F', 'mobile'],
    ['Alcatel', /Alcatel\s?G8395G/i, 'Alcatel G8395G', 'mobile'],
    ['Alcatel', /Alcatel\s?P667E/i, 'Alcatel P667E', 'mobile'],
    ['Alcatel', /Alcatel\s?N371DS/i, 'Alcatel N371DS', 'tablet'],
    ['Alcatel', /Alcatel\s?P3115G/i, 'Alcatel P3115G', 'mobile'],
    ['Alcatel', /Alcatel\s?P3735G/i, 'Alcatel P3735G', 'mobile'],
    ['Alcatel', /Alcatel\s?F731B/i, 'Alcatel F731B', 'mobile'],
    ['Alcatel', /Alcatel\s?K705F/i, 'Alcatel K705F', 'tablet'],
    ['Alcatel', /Alcatel\s?A834DS/i, 'Alcatel A834DS', 'mobile'],
    ['Alcatel', /Alcatel\s?X260DS/i, 'Alcatel X260DS', 'mobile'],
    ['Alcatel', /Alcatel\s?X501B/i, 'Alcatel X501B', 'tablet'],
    ['Alcatel', /Alcatel\s?T662/i, 'Alcatel T662', 'mobile'],
    ['Alcatel', /Alcatel\s?N961U/i, 'Alcatel N961U', 'tablet'],
    ['Alcatel', /Alcatel\s?A975G/i, 'Alcatel A975G', 'mobile'],
    ['Alcatel', /Alcatel\s?N5535G/i, 'Alcatel N5535G', 'mobile'],
    ['Alcatel', /Alcatel\s?606/i, 'Alcatel 606', 'mobile'],
    ['Alcatel', /Alcatel\s?M984/i, 'Alcatel M984', 'mobile'],
    ['Alcatel', /Alcatel\s?F632/i, 'Alcatel F632', 'mobile'],
    ['Alcatel', /Alcatel\s?M2005G/i, 'Alcatel M2005G', 'tablet'],
    ['Alcatel', /Alcatel\s?X813F/i, 'Alcatel X813F', 'mobile'],
    ['Alcatel', /Alcatel\s?K820E/i, 'Alcatel K820E', 'mobile'],
    ['Alcatel', /Alcatel\s?T922DS/i, 'Alcatel T922DS', 'mobile'],
    ['Alcatel', /Alcatel\s?933E/i, 'Alcatel 933E', 'mobile'],
    ['Alcatel', /Alcatel\s?M516DS/i, 'Alcatel M516DS', 'mobile'],
    ['HTC', /HTC\s?G7695G/i, 'HTC G7695G', 'tablet'],
    ['HTC', /HTC\s?913/i, 'HTC 913', 'mobile'],
    ['HTC', /HTC\s?F439F/i, 'HTC F439F', 'mobile'],
    ['HTC', /HTC\s?P514E/i, 'HTC P514E', 'mobile'],
    ['HTC', /HTC\s?P488F/i, 'HTC P488F', 'tablet'],
    ['HTC', /HTC\s?M520F/i, 'HTC M520F', 'mobile'],
    ['HTC', /HTC\s?N870U/i, 'HTC N870U', 'tablet'],
    ['HTC', /HTC\s?T519DS/i, 'HTC T519DS', 'mobile'],
    ['HTC', /HTC\s?P393B/i, 'HTC P393B', 'tablet'],
    ['HTC', /HTC\s?87F/i, 'HTC 87F', 'mobile'],
    ['HTC', /HTC\s?672/i, 'HTC 672', 'mobile'],
    ['HTC', /HTC\s?T56DS/i, 'HTC T56DS', 'mobile'],
    ['HTC', /HTC\s?G532B/i, 'HTC G532B', 'tablet'],
    ['HTC', /HTC\s?N44F/i, 'HTC N44F', 'tablet'],
    ['HTC', /HTC\s?139U/i, 'HTC 139U', 'mobile'],
    ['HTC', /HTC\s?384U/i, 'HTC 384U', 'tablet'],
    ['HTC', /HTC\s?C5775G/i, 'HTC C5775G', 'mobile'],
    ['HTC', /HTC\s?F455U/i, 'HTC F455U', 'tablet'],
    ['HTC', /HTC\s?F577/i, 'HTC F577', 'mobile'],
    ['HTC', /HTC\s?F3735G/i, 'HTC F3735G', 'tablet'],
    ['HTC', /HTC\s?K351E/i, 'HTC K351E', 'mobile'],
    ['HTC', /HTC\s?C363F/i, 'HTC C363F', 'tablet'],
    ['HTC', /HTC\s?G348F/i, 'HTC G348F', 'mobile'],
    ['HTC', /HTC\s?F140E/i, 'HTC F140E', 'mobile'],
    ['HTC', /HTC\s?A418DS/i, 'HTC A418DS', 'tablet'],
    ['HTC', /HTC\s?C597/i, 'HTC C597', 'tablet'],
    ['HTC', /HTC\s?F121/i, 'HTC F121', 'mobile'],
    ['HTC', /HTC\s?M851B/i, 'HTC M851B', 'mobile'],
    ['HTC', /HTC\s?C941E/i, 'HTC C941E', 'tablet'],
    ['HTC', /HTC\s?T160DS/i, 'HTC T160DS', 'mobile'],
    ['HTC', /HTC\s?M50DS/i, 'HTC M50DS', 'tablet'],
    ['HTC', /HTC\s?790F/i, 'HTC 790F', 'mobile'],
    ['HTC', /HTC\s?1955G/i, 'HTC 1955G', 'mobile'],
    ['HTC', /HTC\s?K803/i, 'HTC K803', 'mobile'],
    ['Honor', /HONOR\s?N815U/i, 'HONOR N815U', 'mobile'],
    ['Honor', /HONOR\s?F199B/i, 'HONOR F199B', 'mobile'],
    ['Honor', /HONOR\s?X30B/i, 'HONOR X30B', 'mobile'],
    ['Honor', /HONOR\s?P591E/i, 'HONOR P591E', 'mobile'],
    ['Honor', /HONOR\s?G8025G/i, 'HONOR G8025G', 'tablet'],
    ['Honor', /HONOR\s?T722B/i, 'HONOR T722B', 'tablet'],
    ['Honor', /HONOR\s?G24DS/i, 'HONOR G24DS', 'tablet'],
    ['Honor', /HONOR\s?T616DS/i, 'HONOR T616DS', 'mobile'],
    ['Honor', /HONOR\s?P798B/i, 'HONOR P798B', 'mobile'],
    ['Honor', /HONOR\s?G669B/i, 'HONOR G669B', 'mobile'],
    ['Honor', /HONOR\s?N651/i, 'HONOR N651', 'tablet'],
    ['Honor', /HONOR\s?A19DS/i, 'HONOR A19DS', 'mobile'],
    ['Honor', /HONOR\s?G2335G/i, 'HONOR G2335G', 'mobile'],
    ['Honor', /HONOR\s?N493/i, 'HONOR N493', 'mobile'],
    ['Honor', /HONOR\s?T258B/i, 'HONOR T258B', 'mobile'],
    ['Honor', /HONOR\s?A3845G/i, 'HONOR A3845G', 'mobile'],
    ['Honor', /HONOR\s?G310DS/i, 'HONOR G310DS', 'tablet'],
    ['Honor', /HONOR\s?P695U/i, 'HONOR P695U', 'mobile'],
    ['Honor', /HONOR\s?A21/i, 'HONOR A21', 'mobile'],
    ['Honor', /HONOR\s?7135G/i, 'HONOR 7135G', 'mobile'],
    ['Honor', /HONOR\s?K328U/i, 'HONOR K328U', 'mobile'],
    ['Honor', /HONOR\s?P633/i, 'HONOR P633', 'mobile'],
    ['Honor', /HONOR\s?X981E/i, 'HONOR X981E', 'tablet'],
    ['Honor', /HONOR\s?P703F/i, 'HONOR P703F', 'mobile'],
    ['Honor', /HONOR\s?G381DS/i, 'HONOR G381DS', 'mobile'],
    ['Honor', /HONOR\s?831B/i, 'HONOR 831B', 'tablet'],
    ['Honor', /HONOR\s?K8065G/i, 'HONOR K8065G', 'tablet'],
    ['Honor', /HONOR\s?F8135G/i, 'HONOR F8135G', 'mobile'],
    ['Honor', /HONOR\s?F296/i, 'HONOR F296', 'mobile'],
    ['Meizu', /meizu\s?N6255G/i, 'meizu N6255G', 'mobile'],
    ['Meizu', /meizu\s?T448F/i, 'meizu T448F', 'tablet'],
    ['Meizu', /meizu\s?K711B/i, 'meizu K711B', 'mobile'],
    ['Meizu', /meizu\s?P300DS/i, 'meizu P300DS', 'mobile'],
    ['Meizu', /meizu\s?X279U/i, 'meizu X279U', 'tablet'],
    ['Meizu', /meizu\s?N6105G/i, 'meizu N6105G', 'mobile'],
    ['Meizu', /meizu\s?F863F/i, 'meizu F863F', 'mobile'],
    ['Meizu', /meizu\s?F8815G/i, 'meizu F8815G', 'tablet'],
    ['Meizu', /meizu\s?X557/i, 'meizu X557', 'tablet'],
    ['Meizu', /meizu\s?K2155G/i, 'meizu K2155G', 'mobile'],
    ['Meizu', /meizu\s?F631/i, 'meizu F631', 'tablet'],
    ['Meizu', /meizu\s?P735F/i, 'meizu P735F', 'mobile'],
    ['Meizu', /meizu\s?T779/i, 'meizu T779', 'tablet'],
    ['Meizu', /meizu\s?P563/i, 'meizu P563', 'mobile'],
    ['Meizu', /meizu\s?G248B/i, 'meizu G248B', 'mobile'],
    ['Meizu', /meizu\s?C338B/i, 'meizu C338B', 'mobile'],
    ['Meizu', /meizu\s?M227F/i, 'meizu M227F', 'mobile'],
    ['Meizu', /meizu\s?N835DS/i, 'meizu N835DS', 'mobile'],
    ['Micromax', /Micromax\s?T587U/i, 'Micromax T587U', 'tablet'],
    ['Micromax', /Micromax\s?C887F/i, 'Micromax C887F', 'mobile'],
    ['Micromax', /Micromax\s?A954B/i, 'Micromax A954B', 'mobile'],
    ['Micromax', /Micromax\s?G390DS/i, 'Micromax G390DS', 'tablet'],
    ['Micromax', /Micromax\s?G169U/i, 'Micromax G169U', 'mobile'],
    ['Micromax', /Micromax\s?X297E/i, 'Micromax X297E', 'mobile'],
    ['Micromax', /Micromax\s?G44F/i, 'Micromax G44F', 'tablet'],
    ['Micromax', /Micromax\s?T590F/i, 'Micromax T590F', 'mobile'],
    ['Micromax', /Micromax\s?F446/i, 'Micromax F446', 'tablet'],
    ['Micromax', /Micromax\s?T848E/i, 'Micromax T848E', 'mobile'],
    ['Micromax', /Micromax\s?F873/i, 'Micromax F873', 'mobile'],
    ['Micromax', /Micromax\s?M195B/i, 'Micromax M195B', 'mobile'],
    ['Micromax', /Micromax\s?A62/i, 'Micromax A62', 'mobile'],
    ['Micromax', /Micromax\s?P5085G/i, 'Micromax P5085G', 'mobile'],
    ['Micromax', /Micromax\s?T665B/i, 'Micromax T665B', 'mobile'],
    ['Micromax', /Micromax\s?G273U/i, 'Micromax G273U', 'mobile'],
    ['Micromax', /Micromax\s?101DS/i, 'Micromax 101DS', 'tablet'],
    ['Micromax', /Micromax\s?N4695G/i, 'Micromax N4695G', 'mobile'],
    ['Micromax', /Micromax\s?X998F/i, 'Micromax X998F', 'mobile'],
    ['Micromax', /Micromax\s?N49U/i, 'Micromax N49U', 'mobile'],
    ['Micromax', /Micromax\s?A934E/i, 'Micromax A934E', 'mobile'],
    ['Micromax', /Micromax\s?A2745G/i, 'Micromax A2745G', 'tablet'],
    ['Micromax', /Micromax\s?A113F/i, 'Micromax A113F', 'mobile'],
    ['Micromax', /Micromax\s?A971F/i, 'Micromax A971F', 'mobile'],
    ['Micromax', /Micromax\s?T615B/i, 'Micromax T615B', 'mobile'],
    ['Micromax', /Micromax\s?P341U/i, 'Micromax P341U', 'mobile'],
    ['Micromax', /Micromax\s?K137U/i, 'Micromax K137U', 'tablet'],
    ['Micromax', /Micromax\s?K182B/i, 'Micromax K182B', 'mobile'],
    ['Micromax', /Micromax\s?N946DS/i, 'Micromax N946DS', 'mobile'],
    ['Lava', /LAVA\s?M828/i, 'LAVA M828', 'mobile'],
    ['Lava', /LAVA\s?M89E/i, 'LAVA M89E', 'mobile'],
    ['Lava', /LAVA\s?N806B/i, 'LAVA N806B', 'mobile'],
    ['Lava', /LAVA\s?K872/i, 'LAVA K872', 'mobile'],
    ['Lava', /LAVA\s?P357U/i, 'LAVA P357U', 'mobile'],
    ['Lava', /LAVA\s?P128DS/i, 'LAVA P128DS', 'mobile'],
    ['Lava', /LAVA\s?N349F/i, 'LAVA N349F', 'mobile'],
    ['Lava', /LAVA\s?N740B/i, 'LAVA N740B', 'mobile'],
    ['Lava', /LAVA\s?P901F/i, 'LAVA P901F', 'mobile'],
    ['Lava', /LAVA\s?K431F/i, 'LAVA K431F', 'mobile'],
    ['Lava', /LAVA\s?A287E/i, 'LAVA A287E', 'mobile'],
    ['Lava', /LAVA\s?X833F/i, 'LAVA X833F', 'mobile'],
    ['Lava', /LAVA\s?P121U/i, 'LAVA P121U', 'tablet'],
    ['Lava', /LAVA\s?P126F/i, 'LAVA P126F', 'mobile'],
    ['Lava', /LAVA\s?9265G/i, 'LAVA 9265G', 'mobile'],
    ['Lava', /LAVA\s?C4985G/i, 'LAVA C4985G', 'mobile'],
    ['Lava', /LAVA\s?G2735G/i, 'LAVA G2735G', 'mobile'],
    ['Lava', /LAVA\s?X452U/i, 'LAVA X452U', 'mobile'],
    ['Lava', /LAVA\s?M109B/i, 'LAVA M109B', 'mobile'],
    ['Lava', /LAVA\s?K927F/i, 'LAVA K927F', 'mobile'],
    ['Lava', /LAVA\s?F157DS/i, 'LAVA F157DS', 'mobile'],
    ['Lava', /LAVA\s?P836E/i, 'LAVA P836E', 'mobile'],
    ['Lava', /LAVA\s?C153B/i, 'LAVA C153B', 'mobile'],
    ['Lava', /LAVA\s?C303F/i, 'LAVA C303F', 'mobile'],
    ['Lava', /LAVA\s?K51B/i, 'LAVA K51B', 'mobile'],
    ['Lava', /LAVA\s?F595F/i, 'LAVA F595F', 'mobile'],
    ['Lava', /LAVA\s?N5445G/i, 'LAVA N5445G', 'mobile'],
    ['Lava', /LAVA\s?N211E/i, 'LAVA N211E', 'mobile'],
    ['Lava', /LAVA\s?G920E/i, 'LAVA G920E', 'tablet'],
    ['Lava', /LAVA\s?F189F/i, 'LAVA F189F', 'mobile'],
    ['Lava', /LAVA\s?T695DS/i, 'LAVA T695DS', 'mobile'],
    ['Lava', /LAVA\s?T325F/i, 'LAVA T325F', 'mobile'],
    ['Dialog', /Dialog\s?C4275G/i, 'Dialog C4275G', 'mobile'],
    ['Dialog', /Dialog\s?C840U/i, 'Dialog C840U', 'mobile'],
    ['Dialog', /Dialog\s?F872DS/i, 'Dialog F872DS', 'tablet'],
    ['Dialog', /Dialog\s?G25B/i, 'Dialog G25B', 'tablet'],
    ['Dialog', /Dialog\s?N902DS/i, 'Dialog N902DS', 'mobile'],
    ['Dialog', /Dialog\s?M200E/i, 'Dialog M200E', 'mobile'],
    ['Dialog', /Dialog\s?A177DS/i, 'Dialog A177DS', 'mobile'],
    ['Dialog', /Dialog\s?T6195G/i, 'Dialog T6195G', 'mobile'],
    ['Dialog', /Dialog\s?X542B/i, 'Dialog X542B', 'mobile'],
    ['Dialog', /Dialog\s?G375DS/i, 'Dialog G375DS', 'mobile'],
    ['Dialog', /Dialog\s?X807DS/i, 'Dialog X807DS', 'tablet'],
    ['Dialog', /Dialog\s?T779/i, 'Dialog T779', 'mobile'],
    ['Dialog', /Dialog\s?G986DS/i, 'Dialog G986DS', 'tablet'],
    ['Dialog', /Dialog\s?P535/i, 'Dialog P535', 'mobile'],
    ['Dialog', /Dialog\s?A259/i, 'Dialog A259', 'mobile'],
    ['Dialog', /Dialog\s?T196F/i, 'Dialog T196F', 'mobile'],
    ['Dialog', /Dialog\s?F266E/i, 'Dialog F266E', 'mobile'],
    ['Dialog', /Dialog\s?A108DS/i, 'Dialog A108DS', 'mobile'],
    ['Dialog', /Dialog\s?F285G/i, 'Dialog F285G', 'tablet'],
    ['Dialog', /Dialog\s?C254DS/i, 'Dialog C254DS', 'tablet'],
    ['Mobitel', /Mobitel\s?X900/i, 'Mobitel X900', 'mobile'],
    ['Mobitel', /Mobitel\s?A289/i, 'Mobitel A289', 'tablet'],
    ['Mobitel', /Mobitel\s?P609E/i, 'Mobitel P609E', 'mobile'],
    ['Mobitel', /Mobitel\s?G134/i, 'Mobitel G134', 'tablet'],
    ['Mobitel', /Mobitel\s?N564E/i, 'Mobitel N564E', 'mobile'],
    ['Mobitel', /Mobitel\s?M160DS/i, 'Mobitel M160DS', 'tablet'],
    ['Mobitel', /Mobitel\s?K1785G/i, 'Mobitel K1785G', 'mobile'],
    ['Mobitel', /Mobitel\s?408DS/i, 'Mobitel 408DS', 'tablet'],
    ['Mobitel', /Mobitel\s?T869E/i, 'Mobitel T869E', 'mobile'],
    ['Mobitel', /Mobitel\s?K973/i, 'Mobitel K973', 'mobile'],
    ['Mobitel', /Mobitel\s?X420F/i, 'Mobitel X420F', 'mobile'],
    ['Mobitel', /Mobitel\s?K873E/i, 'Mobitel K873E', 'mobile'],
    ['Mobitel', /Mobitel\s?K877E/i, 'Mobitel K877E', 'mobile'],
    ['Mobitel', /Mobitel\s?X539F/i, 'Mobitel X539F', 'mobile'],
    ['Mobitel', /Mobitel\s?M901B/i, 'Mobitel M901B', 'mobile'],
    ['Mobitel', /Mobitel\s?X121E/i, 'Mobitel X121E', 'mobile'],
    ['Mobitel', /Mobitel\s?G342B/i, 'Mobitel G342B', 'mobile'],
    ['Mobitel', /Mobitel\s?C695/i, 'Mobitel C695', 'mobile'],
    ['Mobitel', /Mobitel\s?N440B/i, 'Mobitel N440B', 'tablet'],
    ['Mobitel', /Mobitel\s?575G/i, 'Mobitel 575G', 'mobile'],
    ['Mobitel', /Mobitel\s?A896DS/i, 'Mobitel A896DS', 'mobile'],
    ['Panasonic', /Panasonic\s?5655G/i, 'Panasonic 5655G', 'mobile'],
    ['Panasonic', /Panasonic\s?T112U/i, 'Panasonic T112U', 'mobile'],
    ['Panasonic', /Panasonic\s?C23B/i, 'Panasonic C23B', 'mobile'],
    ['Panasonic', /Panasonic\s?A304/i, 'Panasonic A304', 'mobile'],
    ['Panasonic', /Panasonic\s?X673F/i, 'Panasonic X673F', 'mobile'],
    ['Panasonic', /Panasonic\s?A618E/i, 'Panasonic A618E', 'mobile'],
    ['Panasonic', /Panasonic\s?G487E/i, 'Panasonic G487E', 'mobile'],
    ['Panasonic', /Panasonic\s?P136E/i, 'Panasonic P136E', 'mobile'],
    ['Panasonic', /Panasonic\s?F947B/i, 'Panasonic F947B', 'mobile'],
    ['Panasonic', /Panasonic\s?F259DS/i, 'Panasonic F259DS', 'mobile'],
    ['Panasonic', /Panasonic\s?C3045G/i, 'Panasonic C3045G', 'tablet'],
    ['Panasonic', /Panasonic\s?T721E/i, 'Panasonic T721E', 'mobile'],
    ['Panasonic', /Panasonic\s?405F/i, 'Panasonic 405F', 'mobile'],
    ['Panasonic', /Panasonic\s?P923E/i, 'Panasonic P923E', 'mobile'],
    ['Panasonic', /Panasonic\s?T499B/i, 'Panasonic T499B', 'mobile'],
    ['Panasonic', /Panasonic\s?A258U/i, 'Panasonic A258U', 'mobile'],
    ['Panasonic', /Panasonic\s?M534E/i, 'Panasonic M534E', 'tablet'],
    ['Panasonic', /Panasonic\s?T415/i, 'Panasonic T415', 'mobile'],
    ['Panasonic', /Panasonic\s?N892F/i, 'Panasonic N892F', 'mobile'],
    ['Panasonic', /Panasonic\s?C343B/i, 'Panasonic C343B', 'mobile'],
    ['Panasonic', /Panasonic\s?F909F/i, 'Panasonic F909F', 'mobile'],
    ['Panasonic', /Panasonic\s?A800/i, 'Panasonic A800', 'mobile'],
    ['Panasonic', /Panasonic\s?C78E/i, 'Panasonic C78E', 'mobile'],
    ['Panasonic', /Panasonic\s?P683/i, 'Panasonic P683', 'tablet'],
    ['Panasonic', /Panasonic\s?P372DS/i, 'Panasonic P372DS', 'mobile'],
    ['Panasonic', /Panasonic\s?C240DS/i, 'Panasonic C240DS', 'mobile'],
    ['Sharp', /SH\-X694U/i, 'SH-X694U', 'mobile'],
    ['Sharp', /SH\-217E/i, 'SH-217E', 'mobile'],
    ['Sharp', /SH\-C107DS/i, 'SH-C107DS', 'tablet'],
    ['Sharp', /SH\-F813DS/i, 'SH-F813DS', 'mobile'],
    ['Sharp', /SH\-K901/i, 'SH-K901', 'mobile'],
    ['Sharp', /SH\-K794E/i, 'SH-K794E', 'mobile'],
    ['Sharp', /SH\-P417E/i, 'SH-P417E', 'mobile'],
    ['Sharp', /SH\-K8805G/i, 'SH-K8805G', 'mobile'],
    ['Sharp', /SH\-T631/i, 'SH-T631', 'tablet'],
    ['Sharp', /SH\-P719B/i, 'SH-P719B', 'mobile'],
    ['Sharp', /SH\-X309U/i, 'SH-X309U', 'tablet'],
    ['Sharp', /SH\-C578E/i, 'SH-C578E', 'tablet'],
    ['Sharp', /SH\-339/i, 'SH-339', 'tablet'],
    ['Sharp', /SH\-K464U/i, 'SH-K464U', 'mobile'],
    ['Sharp', /SH\-C3215G/i, 'SH-C3215G', 'mobile'],
    ['Sharp', /SH\-K599B/i, 'SH-K599B', 'mobile'],
    ['Sharp', /SH\-G851U/i, 'SH-G851U', 'mobile'],
    ['Sharp', /SH\-T868F/i, 'SH-T868F', 'mobile'],
    ['Sharp', /SH\-M446/i, 'SH-M446', 'mobile'],
    ['Sharp', /SH\-A272E/i, 'SH-A272E', 'tablet'],
    ['Sharp', /SH\-F952E/i, 'SH-F952E', 'mobile'],
    ['Sharp', /SH\-C644B/i, 'SH-C644B', 'tablet'],
    ['Sharp', /SH\-K485U/i, 'SH-K485U', 'mobile'],
    ['Sharp', /SH\-T702U/i, 'SH-T702U', 'tablet'],
    ['Sharp', /SH\-A702/i, 'SH-A702', 'mobile'],
    ['Sharp', /SH\-G429U/i, 'SH-G429U', 'tablet'],
    ['Sharp', /SH\-584E/i, 'SH-584E', 'mobile'],
    ['Sharp', /SH\-M997B/i, 'SH-M997B', 'tablet'],
    ['Sharp', /SH\-K4605G/i, 'SH-K4605G', 'mobile'],
    ['Sharp', /SH\-C7745G/i, 'SH-C7745G', 'mobile'],
    ['Sharp', /SH\-N381U/i, 'SH-N381U', 'mobile'],
    ['Fairphone', /FPF534F/i, 'FPF534F', 'mobile'],
    ['Fairphone', /FP925U/i, 'FP925U', 'mobile'],
    ['Fairphone', /FPC919B/i, 'FPC919B', 'mobile'],
    ['Fairphone', /FPC3065G/i, 'FPC3065G', 'mobile'],
    ['Fairphone', /FPC924F/i, 'FPC924F', 'tablet'],
    ['Fairphone', /FPN71DS/i, 'FPN71DS', 'mobile'],
    ['Fairphone', /FPX593DS/i, 'FPX593DS', 'mobile'],
    ['Fairphone', /FPK205G/i, 'FPK205G', 'mobile'],
    ['Fairphone', /FPF737DS/i, 'FPF737DS', 'mobile'],
    ['Fairphone', /FPF4175G/i, 'FPF4175G', 'mobile'],
    ['Fairphone', /FPT25DS/i, 'FPT25DS', 'mobile'],
    ['Fairphone', /FPM189B/i, 'FPM189B', 'mobile'],
    ['Fairphone', /FP927E/i, 'FP927E', 'mobile'],
    ['Fairphone', /FPT213B/i, 'FPT213B', 'mobile'],
    ['Fairphone', /FPN170E/i, 'FPN170E', 'mobile'],
    ['Fairphone', /FPA112/i, 'FPA112', 'mobile'],
    ['Fairphone', /FPC5125G/i, 'FPC5125G', 'tablet'],
    ['Fairphone', /FPT4505G/i, 'FPT4505G', 'mobile'],
    ['Fairphone', /FP22DS/i, 'FP22DS', 'mobile'],
    ['Fairphone', /FPN742F/i, 'FPN742F', 'mobile'],
    ['Nothing', /A0N43U/i, 'A0N43U', 'mobile'],
    ['Nothing', /A0T74U/i, 'A0T74U', 'mobile'],
    ['Nothing', /A0P648B/i, 'A0P648B', 'mobile'],
    ['Nothing', /A0A235B/i, 'A0A235B', 'mobile'],
    ['Nothing', /A0P65E/i, 'A0P65E', 'mobile'],
    ['Nothing', /A0M238/i, 'A0M238', 'mobile'],
    ['Nothing', /A0T885F/i, 'A0T885F', 'mobile'],
    ['Nothing', /A0A9305G/i, 'A0A9305G', 'tablet'],
    ['Nothing', /A0F438E/i, 'A0F438E', 'mobile'],
    ['Nothing', /A0P982/i, 'A0P982', 'mobile'],
    ['Nothing', /A0409DS/i, 'A0409DS', 'mobile'],
    ['Nothing', /A0K326B/i, 'A0K326B', 'tablet'],
    ['Nothing', /A0A8215G/i, 'A0A8215G', 'mobile'],
    ['Nothing', /A0G187F/i, 'A0G187F', 'mobile'],
    ['Nothing', /A0K201/i, 'A0K201', 'mobile'],
    ['Nothing', /A0K585U/i, 'A0K585U', 'mobile'],
    ['Nothing', /A0X5565G/i, 'A0X5565G', 'tablet'],
    ['Nothing', /A0X422DS/i, 'A0X422DS', 'mobile'],
    ['Nothing', /A0G4425G/i, 'A0G4425G', 'mobile'],
    ['Nothing', /A0C260B/i, 'A0C260B', 'mobile'],
    ['Nothing', /A0P300U/i, 'A0P300U', 'mobile'],
    ['Nothing', /A0K45U/i, 'A0K45U', 'mobile'],
    ['Nothing', /A0X834F/i, 'A0X834F', 'mobile'],
    ['Nothing', /A0N104F/i, 'A0N104F', 'mobile'],
    ['Nothing', /A0C8655G/i, 'A0C8655G', 'mobile'],
    ['Nothing', /A0C463B/i, 'A0C463B', 'mobile'],
    ['TCL', /TX371F/i, 'TX371F', 'tablet'],
    ['TCL', /TK654E/i, 'TK654E', 'mobile'],
    ['TCL', /TF983B/i, 'TF983B', 'mobile'],
    ['TCL', /TM888B/i, 'TM888B', 'mobile'],
    ['TCL', /TF620B/i, 'TF620B', 'mobile'],
    ['TCL', /TC262B/i, 'TC262B', 'mobile'],
    ['TCL', /TN9035G/i, 'TN9035G', 'mobile'],
    ['TCL', /T535/i, 'T535', 'mobile'],
    ['TCL', /TK39DS/i, 'TK39DS', 'mobile'],
    ['TCL', /TF25B/i, 'TF25B', 'mobile'],
    ['TCL', /TN8045G/i, 'TN8045G', 'mobile'],
    ['TCL', /TX202DS/i, 'TX202DS', 'mobile'],
    ['TCL', /TG585U/i, 'TG585U', 'mobile'],
    ['TCL', /TM77DS/i, 'TM77DS', 'mobile'],
    ['TCL', /TG241U/i, 'TG241U', 'mobile'],
    ['TCL', /TK299U/i, 'TK299U', 'tablet'],
    ['TCL', /TP803DS/i, 'TP803DS', 'mobile'],
    ['TCL', /TF190/i, 'TF190', 'mobile'],
    ['TCL', /T828DS/i, 'T828DS', 'mobile'],
    ['TCL', /TK35DS/i, 'TK35DS', 'tablet'],
    ['TCL', /TM877B/i, 'TM877B', 'mobile'],
    ['TCL', /T110F/i, 'T110F', 'mobile'],
    ['TCL', /TG287E/i, 'TG287E', 'mobile'],
    ['Blackview', /BVK50E/i, 'BVK50E', 'mobile'],
    ['Blackview', /BVK2125G/i, 'BVK2125G', 'mobile'],
    ['Blackview', /BVN399DS/i, 'BVN399DS', 'mobile'],
    ['Blackview', /BVC328DS/i, 'BVC328DS', 'mobile'],
    ['Blackview', /BVT869F/i, 'BVT869F', 'tablet'],
    ['Blackview', /BVC270B/i, 'BVC270B', 'mobile'],
    ['Blackview', /BVA1245G/i, 'BVA1245G', 'mobile'],
    ['Blackview', /BVA9065G/i, 'BVA9065G', 'mobile'],
    ['Blackview', /BVM707/i, 'BVM707', 'mobile'],
    ['Blackview', /BVX2255G/i, 'BVX2255G', 'mobile'],
    ['Blackview', /BVG437DS/i, 'BVG437DS', 'tablet'],
    ['Blackview', /BVT858F/i, 'BVT858F', 'mobile'],
    ['Blackview', /BVC102U/i, 'BVC102U', 'tablet'],
    ['Blackview', /BVP962U/i, 'BVP962U', 'tablet'],
    ['Blackview', /BVC65DS/i, 'BVC65DS', 'mobile'],
    ['Blackview', /BVK699E/i, 'BVK699E', 'mobile'],
    ['Blackview', /BVP790F/i, 'BVP790F', 'mobile'],
    ['Blackview', /BVC277F/i, 'BVC277F', 'mobile'],
    ['Blackview', /BV251E/i, 'BV251E', 'mobile'],
    ['Doogee', /SA182U/i, 'SA182U', 'mobile'],
    ['Doogee', /SK104F/i, 'SK104F', 'mobile'],
    ['Doogee', /SN149DS/i, 'SN149DS', 'tablet'],
    ['Doogee', /S504F/i, 'S504F', 'mobile'],
    ['Doogee', /SA537DS/i, 'SA537DS', 'tablet'],
    ['Doogee', /SN968DS/i, 'SN968DS', 'mobile'],
    ['Doogee', /SF146DS/i, 'SF146DS', 'mobile'],
    ['Doogee', /ST586F/i, 'ST586F', 'mobile'],
    ['Doogee', /S844/i, 'S844', 'tablet'],
    ['Doogee', /SN703DS/i, 'SN703DS', 'mobile'],
    ['Doogee', /ST4825G/i, 'ST4825G', 'tablet'],
    ['Doogee', /SM127DS/i, 'SM127DS', 'mobile'],
    ['Doogee', /SA379B/i, 'SA379B', 'mobile'],
    ['Doogee', /SA71U/i, 'SA71U', 'mobile'],
    ['Doogee', /SM123DS/i, 'SM123DS', 'mobile'],
    ['Doogee', /SP995/i, 'SP995', 'mobile'],
    ['Doogee', /SX465B/i, 'SX465B', 'mobile'],
    ['Doogee', /SF182E/i, 'SF182E', 'mobile'],
    ['Doogee', /SA21B/i, 'SA21B', 'tablet'],
    ['Doogee', /SG775DS/i, 'SG775DS', 'mobile'],
    ['Doogee', /ST280/i, 'ST280', 'tablet'],
    ['Doogee', /SK510F/i, 'SK510F', 'mobile'],
    ['Doogee', /SA377/i, 'SA377', 'mobile'],
    ['Doogee', /S638DS/i, 'S638DS', 'mobile'],
    ['Doogee', /S261/i, 'S261', 'mobile'],
    ['Ulefone', /Armor\s?A803B/i, 'Armor A803B', 'mobile'],
    ['Ulefone', /Armor\s?F386F/i, 'Armor F386F', 'mobile'],
    ['Ulefone', /Armor\s?G813DS/i, 'Armor G813DS', 'mobile'],
    ['Ulefone', /Armor\s?T344B/i, 'Armor T344B', 'mobile'],
    ['Ulefone', /Armor\s?855U/i, 'Armor 855U', 'mobile'],
    ['Ulefone', /Armor\s?M387F/i, 'Armor M387F', 'mobile'],
    ['Ulefone', /Armor\s?F255/i, 'Armor F255', 'mobile'],
    ['Ulefone', /Armor\s?G5905G/i, 'Armor G5905G', 'tablet'],
    ['Ulefone', /Armor\s?A977F/i, 'Armor A977F', 'tablet'],
    ['Ulefone', /Armor\s?K521DS/i, 'Armor K521DS', 'mobile'],
    ['Ulefone', /Armor\s?F627E/i, 'Armor F627E', 'mobile'],
    ['Ulefone', /Armor\s?N714F/i, 'Armor N714F', 'mobile'],
    ['Ulefone', /Armor\s?N463DS/i, 'Armor N463DS', 'tablet'],
    ['Ulefone', /Armor\s?G505G/i, 'Armor G505G', 'tablet'],
    ['Ulefone', /Armor\s?P205F/i, 'Armor P205F', 'mobile'],
    ['Ulefone', /Armor\s?A425G/i, 'Armor A425G', 'tablet'],
    ['Ulefone', /Armor\s?N300/i, 'Armor N300', 'mobile'],
    ['Ulefone', /Armor\s?C737B/i, 'Armor C737B', 'mobile'],
    ['Umidigi', /UMIDIGI\s?P19DS/i, 'UMIDIGI P19DS', 'mobile'],
    ['Umidigi', /UMIDIGI\s?N397U/i, 'UMIDIGI N397U', 'mobile'],
    ['Umidigi', /UMIDIGI\s?P833E/i, 'UMIDIGI P833E', 'mobile'],
    ['Umidigi', /UMIDIGI\s?T210B/i, 'UMIDIGI T210B', 'mobile'],
    ['Umidigi', /UMIDIGI\s?C341E/i, 'UMIDIGI C341E', 'tablet'],
    ['Umidigi', /UMIDIGI\s?K557DS/i, 'UMIDIGI K557DS', 'mobile'],
    ['Umidigi', /UMIDIGI\s?K994E/i, 'UMIDIGI K994E', 'mobile'],
    ['Umidigi', /UMIDIGI\s?A750DS/i, 'UMIDIGI A750DS', 'mobile'],
    ['Umidigi', /UMIDIGI\s?T684U/i, 'UMIDIGI T684U', 'tablet'],
    ['Umidigi', /UMIDIGI\s?X502DS/i, 'UMIDIGI X502DS', 'mobile'],
    ['Umidigi', /UMIDIGI\s?F896U/i, 'UMIDIGI F896U', 'mobile'],
    ['Umidigi', /UMIDIGI\s?M237DS/i, 'UMIDIGI M237DS', 'tablet'],
    ['Umidigi', /UMIDIGI\s?G160DS/i, 'UMIDIGI G160DS', 'mobile'],
    ['Umidigi', /UMIDIGI\s?C604B/i, 'UMIDIGI C604B', 'mobile'],
    ['Umidigi', /UMIDIGI\s?C256E/i, 'UMIDIGI C256E', 'tablet'],
    ['Umidigi', /UMIDIGI\s?K277/i, 'UMIDIGI K277', 'mobile'],
    ['Umidigi', /UMIDIGI\s?N921F/i, 'UMIDIGI N921F', 'mobile'],
    ['Umidigi', /UMIDIGI\s?M8925G/i, 'UMIDIGI M8925G', 'mobile'],
    ['Umidigi', /UMIDIGI\s?107F/i, 'UMIDIGI 107F', 'mobile'],
    ['Umidigi', /UMIDIGI\s?P242E/i, 'UMIDIGI P242E', 'tablet'],
    ['Oukitel', /WPC596DS/i, 'WPC596DS', 'mobile'],
    ['Oukitel', /WPC941E/i, 'WPC941E', 'mobile'],
    ['Oukitel', /WPK705/i, 'WPK705', 'tablet'],
    ['Oukitel', /WPN894E/i, 'WPN894E', 'mobile'],
    ['Oukitel', /WP993DS/i, 'WP993DS', 'mobile'],
    ['Oukitel', /WPP860DS/i, 'WPP860DS', 'tablet'],
    ['Oukitel', /WPC185F/i, 'WPC185F', 'tablet'],
    ['Oukitel', /WPG150U/i, 'WPG150U', 'mobile'],
    ['Oukitel', /WPK252/i, 'WPK252', 'mobile'],
    ['Oukitel', /WPA25DS/i, 'WPA25DS', 'mobile'],
    ['Oukitel', /WPP317/i, 'WPP317', 'mobile'],
    ['Oukitel', /WPK940/i, 'WPK940', 'mobile'],
    ['Oukitel', /WPT127DS/i, 'WPT127DS', 'mobile'],
    ['Oukitel', /WPN385DS/i, 'WPN385DS', 'mobile'],
    ['Oukitel', /WP215G/i, 'WP215G', 'mobile'],
    ['Oukitel', /WPG255U/i, 'WPG255U', 'mobile'],
    ['Oukitel', /WPP545G/i, 'WPP545G', 'mobile'],
    ['Oukitel', /WPG374E/i, 'WPG374E', 'mobile'],
    ['Oukitel', /WPT125/i, 'WPT125', 'mobile'],
    ['Oukitel', /WPF372F/i, 'WPF372F', 'tablet'],
    ['Oukitel', /WPA868E/i, 'WPA868E', 'tablet'],
    ['Oukitel', /WPG820/i, 'WPG820', 'tablet'],
    ['Oukitel', /WPG855G/i, 'WPG855G', 'mobile'],
    ['Oukitel', /WPN163E/i, 'WPN163E', 'mobile'],
    ['Oukitel', /WP695B/i, 'WP695B', 'mobile'],
    ['Cubot', /CUBOT\s?C7165G/i, 'CUBOT C7165G', 'mobile'],
    ['Cubot', /CUBOT\s?P24/i, 'CUBOT P24', 'mobile'],
    ['Cubot', /CUBOT\s?N508E/i, 'CUBOT N508E', 'tablet'],
    ['Cubot', /CUBOT\s?A8295G/i, 'CUBOT A8295G', 'mobile'],
    ['Cubot', /CUBOT\s?G196E/i, 'CUBOT G196E', 'tablet'],
    ['Cubot', /CUBOT\s?P172DS/i, 'CUBOT P172DS', 'tablet'],
    ['Cubot', /CUBOT\s?K2445G/i, 'CUBOT K2445G', 'mobile'],
    ['Cubot', /CUBOT\s?X347E/i, 'CUBOT X347E', 'mobile'],
    ['Cubot', /CUBOT\s?F925F/i, 'CUBOT F925F', 'mobile'],
    ['Cubot', /CUBOT\s?M1835G/i, 'CUBOT M1835G', 'mobile'],
    ['Cubot', /CUBOT\s?P349E/i, 'CUBOT P349E', 'tablet'],
    ['Cubot', /CUBOT\s?K969U/i, 'CUBOT K969U', 'mobile'],
    ['Cubot', /CUBOT\s?A353E/i, 'CUBOT A353E', 'tablet'],
    ['Cubot', /CUBOT\s?X242/i, 'CUBOT X242', 'mobile'],
    ['Cubot', /CUBOT\s?P907E/i, 'CUBOT P907E', 'mobile'],
    ['Cubot', /CUBOT\s?159DS/i, 'CUBOT 159DS', 'mobile'],
    ['Cubot', /CUBOT\s?F403U/i, 'CUBOT F403U', 'mobile'],
    ['Cubot', /CUBOT\s?C278U/i, 'CUBOT C278U', 'mobile'],
    ['Cubot', /CUBOT\s?A947E/i, 'CUBOT A947E', 'mobile'],
    ['Cubot', /CUBOT\s?M802B/i, 'CUBOT M802B', 'mobile'],
    ['Cubot', /CUBOT\s?X820U/i, 'CUBOT X820U', 'mobile'],
    ['Cubot', /CUBOT\s?N707/i, 'CUBOT N707', 'mobile'],
    ['Cubot', /CUBOT\s?X767U/i, 'CUBOT X767U', 'mobile'],
    ['Cubot', /CUBOT\s?X903E/i, 'CUBOT X903E', 'tablet'],
    ['Cubot', /CUBOT\s?X71DS/i, 'CUBOT X71DS', 'mobile'],
    ['Cubot', /CUBOT\s?3405G/i, 'CUBOT 3405G', 'tablet'],
    ['Wiko', /W\-KX925F/i, 'W-KX925F', 'mobile'],
    ['Wiko', /W\-KX164F/i, 'W-KX164F', 'mobile'],
    ['Wiko', /W\-KA9205G/i, 'W-KA9205G', 'tablet'],
    ['Wiko', /W\-KK466B/i, 'W-KK466B', 'mobile'],
    ['Wiko', /W\-KN610/i, 'W-KN610', 'mobile'],
    ['Wiko', /W\-KF747U/i, 'W-KF747U', 'mobile'],
    ['Wiko', /W\-KT574DS/i, 'W-KT574DS', 'mobile'],
    ['Wiko', /W\-KG953F/i, 'W-KG953F', 'mobile'],
    ['Wiko', /W\-KT193U/i, 'W-KT193U', 'mobile'],
    ['Wiko', /W\-KP3755G/i, 'W-KP3755G', 'tablet'],
    ['Wiko', /W\-KG868B/i, 'W-KG868B', 'mobile'],
    ['Wiko', /W\-KN292U/i, 'W-KN292U', 'mobile'],
    ['Wiko', /W\-KN651U/i, 'W-KN651U', 'mobile'],
    ['Wiko', /W\-KA233/i, 'W-KA233', 'tablet'],
    ['Wiko', /W\-KP215E/i, 'W-KP215E', 'mobile'],
    ['Wiko', /W\-KC673/i, 'W-KC673', 'mobile'],
    ['Wiko', /W\-KM761/i, 'W-KM761', 'mobile'],
    ['Wiko', /W\-KT59/i, 'W-KT59', 'mobile'],
    ['Wiko', /W\-KT359DS/i, 'W-KT359DS', 'mobile'],
    ['Wiko', /W\-KA202U/i, 'W-KA202U', 'mobile'],
    ['Wiko', /W\-K340/i, 'W-K340', 'mobile'],
    ['Wiko', /W\-KX3445G/i, 'W-KX3445G', 'mobile'],
    ['Wiko', /W\-K507B/i, 'W-K507B', 'mobile'],
    ['Wiko', /W\-KN685G/i, 'W-KN685G', 'tablet'],
    ['Wiko', /W\-KA99DS/i, 'W-KA99DS', 'mobile'],
    ['Wiko', /W\-KP622B/i, 'W-KP622B', 'mobile'],
    ['Wiko', /W\-KP904/i, 'W-KP904', 'mobile'],
    ['Wiko', /W\-KX587DS/i, 'W-KX587DS', 'mobile'],
    ['Wiko', /W\-KA435E/i, 'W-KA435E', 'mobile'],
    ['Wiko', /W\-KN105/i, 'W-KN105', 'mobile'],
    ['Wiko', /W\-KM156E/i, 'W-KM156E', 'mobile'],
    ['Wiko', /W\-KX843U/i, 'W-KX843U', 'tablet'],
    ['Wiko', /W\-KX561DS/i, 'W-KX561DS', 'mobile'],
    ['Wiko', /W\-K626E/i, 'W-K626E', 'mobile'],
    ['BLU', /BLU\s?T2745G/i, 'BLU T2745G', 'tablet'],
    ['BLU', /BLU\s?A804DS/i, 'BLU A804DS', 'mobile'],
    ['BLU', /BLU\s?801E/i, 'BLU 801E', 'tablet'],
    ['BLU', /BLU\s?C294U/i, 'BLU C294U', 'mobile'],
    ['BLU', /BLU\s?N268/i, 'BLU N268', 'tablet'],
    ['BLU', /BLU\s?G6815G/i, 'BLU G6815G', 'mobile'],
    ['BLU', /BLU\s?N653F/i, 'BLU N653F', 'tablet'],
    ['BLU', /BLU\s?G969/i, 'BLU G969', 'mobile'],
    ['BLU', /BLU\s?G71E/i, 'BLU G71E', 'mobile'],
    ['BLU', /BLU\s?C806F/i, 'BLU C806F', 'mobile'],
    ['BLU', /BLU\s?T384DS/i, 'BLU T384DS', 'mobile'],
    ['BLU', /BLU\s?N901DS/i, 'BLU N901DS', 'mobile'],
    ['BLU', /BLU\s?C39U/i, 'BLU C39U', 'mobile'],
    ['BLU', /BLU\s?P890B/i, 'BLU P890B', 'mobile'],
    ['BLU', /BLU\s?944U/i, 'BLU 944U', 'tablet'],
    ['BLU', /BLU\s?P227U/i, 'BLU P227U', 'mobile'],
    ['BLU', /BLU\s?G685DS/i, 'BLU G685DS', 'mobile'],
    ['BLU', /BLU\s?G836DS/i, 'BLU G836DS', 'tablet'],
    ['BLU', /BLU\s?894U/i, 'BLU 894U', 'mobile'],
    ['BLU', /BLU\s?M587B/i, 'BLU M587B', 'tablet'],
    ['BLU', /BLU\s?K977DS/i, 'BLU K977DS', 'mobile'],
    ['BLU', /BLU\s?A267/i, 'BLU A267', 'mobile'],
    ['BLU', /BLU\s?K257F/i, 'BLU K257F', 'mobile'],
    ['BLU', /BLU\s?M3435G/i, 'BLU M3435G', 'tablet'],
    ['BLU', /BLU\s?295U/i, 'BLU 295U', 'tablet']
  ];

  var BROWSERS = [
    ['Edge', /edg(?:e|ios|a)?\/([\d.]+)/i],
    ['Opera', /(?:opera|opr|opios)[\/ ]([\d.]+)/i],
    ['Samsung Internet', /samsungbrowser\/([\d.]+)/i],
    ['UC Browser', /ucbrowser\/([\d.]+)/i],
    ['Yandex', /yabrowser\/([\d.]+)/i],
    ['Firefox', /(?:firefox|fxios)\/([\d.]+)/i],
    ['Chrome', /(?:chrome|crios)\/([\d.]+)/i],
    ['Safari', /version\/([\d.]+).*safari/i],
    ['IE', /(?:msie |trident.*rv:)([\d.]+)/i],
  ];

  var OSES = [
    ['Windows', /windows nt ([\d.]+)/i],
    ['iOS', /(?:iphone|ipad|ipod).*os ([\d_]+)/i],
    ['macOS', /mac os x ([\d_.]+)/i],
    ['Android', /android ([\d.]+)/i],
    ['Chrome OS', /cros [\w]+ ([\d.]+)/i],
    ['Linux', /linux/i],
  ];

  function detect(ua) {
    var result = { browser: 'Other', browserVersion: null, os: 'Other', osVersion: null, vendor: null, model: null, type: 'desktop' };
    var i, m;
    for (i = 0; i < BROWSERS.length; i++) {
      m = ua.match(BROWSERS[i][1]);
      if (m) {
        result.browser = BROWSERS[i][0];
        result.browserVersion = m[1] || null;
        break;
      }
    }
    for (i = 0; i < OSES.length; i++) {
      m = ua.match(OSES[i][1]);
      if (m) {
        result.os = OSES[i][0];
        result.osVersion = m[1] ? m[1].replace(/_/g, '.') : null;
        break;
      }
    }
    for (i = 0; i < DEVICE_MODELS.length; i++) {
      if (DEVICE_MODELS[i][1].test(ua)) {
        result.vendor = DEVICE_MODELS[i][0];
        result.model = DEVICE_MODELS[i][2];
        result.type = DEVICE_MODELS[i][3];
        break;
      }
    }
    if (result.type === 'desktop' && /mobi|iphone|android.*mobile/i.test(ua)) result.type = 'mobile';
    if (result.type === 'desktop' && /ipad|tablet|android(?!.*mobile)/i.test(ua)) result.type = 'tablet';
    return result;
  }

  function context() {
    var nav = window.navigator || {};
    var scr = window.screen || {};
    return {
      app: config.app,
      v: VERSION,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || null,
      title: document.title,
      lang: nav.language || null,
      screen: (scr.width || 0) + 'x' + (scr.height || 0),
      viewport: window.innerWidth + 'x' + window.innerHeight,
      device: state.device,
      tz: (function () {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
          return null;
        }
      })(),
    };
  }

  function enqueue(type, name, props) {
    if (config.sampleRate < 1 && Math.random() > config.sampleRate) return;
    var session = touchSession();
    if (type === 'page') {
      session.pages += 1;
      write(SESSION_KEY, JSON.stringify(session));
    }
    var event = {
      id: uuid(),
      type: type,
      name: name || null,
      props: props || {},
      ts: now(),
      visitorId: state.visitorId,
      sessionId: state.sessionId,
      userId: state.userId,
      ctx: context(),
    };
    state.queue.push(event);
    saveQueue();
    log(type, name, props);
  }

  function flush() {
    if (!config.endpoint || !state.queue.length) return;
    var batch = state.queue.slice(0, 50);
    var payload = JSON.stringify({ events: batch });
    var sent = false;
    if (window.navigator && typeof window.navigator.sendBeacon === 'function') {
      try {
        sent = window.navigator.sendBeacon(config.endpoint, payload);
      } catch (e) {
        sent = false;
      }
    }
    if (!sent) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
        sent = true;
      } catch (e) {
        sent = false;
      }
    }
    if (sent) {
      state.queue = state.queue.slice(batch.length);
      saveQueue();
    }
  }

  function patchHistory() {
    var push = window.history.pushState;
    var replace = window.history.replaceState;
    window.history.pushState = function () {
      var r = push.apply(this, arguments);
      enqueue('page');
      return r;
    };
    window.history.replaceState = function () {
      return replace.apply(this, arguments);
    };
    window.addEventListener('popstate', function () {
      enqueue('page');
    });
  }

  var commands = {
    init: function (opts) {
      if (state.initialized) return;
      opts = opts || {};
      for (var k in opts) {
        if (Object.prototype.hasOwnProperty.call(opts, k)) config[k] = opts[k];
      }
      state.queue = loadQueue();
      state.visitorId = visitor();
      state.device = detect((window.navigator && window.navigator.userAgent) || '');
      touchSession();
      patchHistory();
      enqueue('page');
      state.flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);
      window.addEventListener('pagehide', flush);
      state.initialized = true;
    },
    page: function () {
      enqueue('page');
    },
    track: function (name, props) {
      enqueue('track', name, props);
    },
    identify: function (userId) {
      state.userId = userId == null ? null : String(userId);
    },
    debug: function (on) {
      config.debug = !!on;
    },
  };

  function bzq(cmd) {
    var fn = commands[cmd];
    if (!fn) return;
    return fn.apply(null, Array.prototype.slice.call(arguments, 1));
  }

  bzq.version = VERSION;
  bzq._state = state;
  window.bzq = bzq;
})(window, document);
