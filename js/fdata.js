/**
 * 获得基金各种数据
 */
var fdata = (function(doc) { // 使用闭包，变量隐藏
	/* 获得同花顺基金估值地址 */
	var thsValuationUrl = "http://gz.fund.10jqka.com.cn/?module=api&controller=index&action=real&codes=";

	/* 获得好买网基金估值地址 */
	var hmValuationUrl = "http://www.howbuy.com/fund/ajax/gmfund/fundnetestimatejson.htm?jjdmstr=";

	/* 获得天天基金估值地址,每次一个 */
	var ttValuationUrl = "http://fund.eastmoney.com/data/funddataforgznew.aspx?t=basewap&cb=a&fc=";

	/* 获得基金的信息 */
	var fundInfoUrl = "http://fund.10jqka.com.cn/data/client/myfund/";

	// 要返回的真正的fdata对象。
	var fd = function() {
		//构造函数
	};

	// 基本的基金信息
	fd.FundInfo = function() {
		/** 基金代码 */
		this.code = "";

		/** 基金名,天天中找到。 */
		this.name = "";

		/** 基金当日净值 */
		this.curValue = 0;

		/** 基金当日净值变化率 */
		this.curValueRate = -100;

		/** 基金净值时间 */
		this.curDate = "";

		/** 基金上一日净值 */
		this.preValue = 0;

		/** 基金估值时间 */
		this.valuateDate = "";

		/** 同花顺基金估值 */
		this.thsValuation = 0;

		/** 同花顺基金估值变化率 */
		this.thsValuationRate = -100;

		/** 好买网基金估值 */
		this.hmValuation = 0;

		/** 好买网基金估值变化率 */
		this.hmValuationRate = -100;

		/** 天天基金估值,及变化率 */
		this.ttValuation = 0;

		/** 天天基金估值变化率 */
		this.ttValuationRate = -100;

		/** 本基金一些基本信息，JSON对象  */
		this.jsonFundInfo = null;


		this.toString = function() {
			return JSON.stringify(this);
		};

	};

	// 基金信息数组
	fd.funds = {};

	// 每完成一个异步调用加1,总次数到了就是数据准备好了。
	// 同花顺1次，好买网1次，天天基金要每一个fund一次。
	var count = 0;
	// 总次数，至少3次
	var tcount = 3;

	/** 
	 * 数据准备好执行函数func
	 *
	 */
	fd.ready = function(func) {

		function setData() {
			// 以天天为基础合并
			var ttfunds = fd.funds['tt'];
			for (var key in ttfunds) {
				//console.log(key);
				try {
					ttfunds[key].preValue = (fd.funds['ths'])[key].preValue;
					ttfunds[key].thsValuation = fd.funds['ths'][key].thsValuation;
					ttfunds[key].thsValuationRate = fd.funds['ths'][key].thsValuationRate;
				} catch (e) {
					console.log(e.message);
				}
				try {
					ttfunds[key].hmValuation = fd.funds['hm'][key].hmValuation;
					ttfunds[key].hmValuationRate = fd.funds['hm'][key].hmValuationRate;
				} catch (e) {
					console.log(e.message);
				}

				ttfunds[key].curValueRate = Math.round((ttfunds[key].curValue - ttfunds[key].preValue) * 10000.0 / ttfunds[key].preValue) / 100.0;
				console.log(ttfunds[key]);
			}
			fd.funds = ttfunds;
			// 回调处理函数
			func();
		}

		var t = setInterval(function() {
			console.log(count + "_" + tcount);
			if (count == tcount) {
				clearInterval(t);
				t = null;
				setData();
			} else {
				console.log("wait...")
			}
		}, 200);

		// 超时停止
		setTimeout(function() {
			if (t) {
				console.log('force stop!');
				clearInterval(t);
				setData();
			}
		}, 5000);
	}


	/** 
	 * 获得基金的估值
	 *
	 */
	fd.getFundValuation = function(fundlist) {
		var fcodes = fundlist.split(',');
		count = 0;
		tcount = 2 + fcodes.length;

		// 天天基金估值
		var ttfunds = {};
		for (var i = 0; i < fcodes.length; i++) {
			mui.get(ttValuationUrl + fcodes[i], '', function(script) {
				console.log("天天基金:" + script);
				var fval = JSON.parse(script.substring(2, script.length - 2)) // 参数cb=a

				// 有同步问题
				/*
				console.log("天天基金:" + fd.funds[fcodes[i]]);
				var finfo = fd.funds[fcodes[i]];
				if (fd.funds[fcodes[i]] == undefined) {
					finfo = new fd.FundInfo();
				}
				*/

				var finfo = new fd.FundInfo();
				finfo.code = fval.fundcode; // 不能用fcodes[i]，i已经是循环之后的数了。
				finfo.name = fval.name;
				finfo.curValue = fval.dwjz;
				finfo.curDate = fval.jzrq;
				finfo.valuateDate = fval.gztime;
				finfo.ttValuation = fval.gsz;
				finfo.ttValuationRate = fval.gszzl;
				ttfunds[finfo.code] = finfo;

				count++;

			}, ''); // script还要试
		}

		// 同花顺估值
		var thsfunds = {};
		mui.get(thsValuationUrl + fundlist, '', function(jsonData) {
			console.log("同花顺:" + JSON.stringify(jsonData));
			for (var i = 0; i < fcodes.length; i++) {
				var fval = jsonData.data[fcodes[i]];
				var finfo = new fd.FundInfo();
				finfo.preValue = fval.pre;
				finfo.thsValuation = fval.value;
				finfo.thsValuationRate = Math.round((fval.value - fval.pre) * 10000.0 / fval.pre) / 100.0;
				thsfunds[fcodes[i]] = finfo;
			}
			count++;
		}, 'json');

		//  好买网估值
		var hmfunds = {};
		mui.get(hmValuationUrl + fundlist, '', function(jsonData) {
			console.log("好买网:" + JSON.stringify(jsonData));
			for (var i = 0; i < fcodes.length; i++) {
				var fval = jsonData[i];
				var finfo = new fd.FundInfo();
				finfo.hmValuation = fval.valuation;
				finfo.hmValuationRate = fval.gzhb;
				hmfunds[fval.code] = finfo;
			}
			count++;
		}, 'json');

		fd.funds['tt'] = ttfunds;
		fd.funds['ths'] = thsfunds;
		fd.funds['hm'] = hmfunds;

	};

	/* 获得基金的估值,暂时先一个个的取，取一段数据插一段 */
	fd.getFundValuationOld = function(fundcode) {
		//? mui.ajaxSettings.async = 'false';
		var table = doc.body.querySelector('.mui-table-view');
		//var cells = document.body.querySelectorAll('.mui-table-view-cell');

		var li = doc.createElement('li');
		li.className = 'mui-table-view-cell';
		li.innerHTML = '基金代码: ' + fundcode;
		table.appendChild(li);

		//  天天基金估值
		mui.get(ttValuationUrl + fundcode, '', function(script) {
			console.log(script);
			var fval = JSON.parse(script.substring(2, script.length - 2)) // 参数cb=a

			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金名称: ' + fval.name;
			table.appendChild(li);

			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金净值: ' + fval.dwjz;
			table.appendChild(li);
			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金净值时间: ' + fval.jzrq;
			table.appendChild(li);
			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金估值时间: ' + fval.gztime;
			table.appendChild(li);
			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '天天基金估值: ' + fval.gsz + "_" + fval.gszzl + "%";
			table.appendChild(li);

		}, 'ascript'); // script还要试

		//  同花顺估值
		mui.getJSON(thsValuationUrl + fundcode, '', function(jsonData) {
			console.log(JSON.stringify(jsonData));
			//doc.getElementById("log").innerHTML = JSON.stringify(data);

			var fval = jsonData.data[fundcode];
			//console.log(fval);

			/*
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金净值(上日): ' + fval.pre;
			table.appendChild(li);
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金估值时间: ' + fval.date + "_" + fval.time;
			table.appendChild(li);
			*/

			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '同花顺估值: ' + fval.value;
			table.appendChild(li);

		});

		//  好买网估值
		mui.getJSON(hmValuationUrl + fundcode, '', function(jsonData) {
			console.log(JSON.stringify(jsonData));
			var fval = jsonData[0];

			var li = doc.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '好买网估值: ' + fval.valuation + "_" + fval.gzhb + "%";
			table.appendChild(li);

		});


	};


	return fd;
})(document);