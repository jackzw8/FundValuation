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

	/* 获得同花顺自选基金估值地址 */
	var thsValuationByUserIDUrl = "http://fund.10jqka.com.cn/myfund.php?userid=";

	/* 指数报价，不需要参数，返回17个常用指数的报价 */
	var indexQuoteUrl = "http://q.10jqka.com.cn/interface/stock/zs/zdf/desc/1/quote/quote";

	// 要返回的真正的fdata函数。
	var fd = function() {};
	// 基金信息对象
	fd.funds = {}; // 按条件搜索的基金
	fd.fundsbyid = {}; // 根据同花顺用户id自选的基金

	// 基本的基金信息类
	fd.FundInfo = function() {
		//构造函数
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

	// 每完成一个异步调用加1,总次数到了就是数据准备好了。
	// 同花顺1次，好买网1次，天天基金要每一个fund一次。
	var count = 0;
	// 总次数，计算出来
	var tcount = -1;

	/**
	 * 数据准备好了，执行函数func
	 *
	 */
	fd.ready = function(func, divid) {

		function setData() {
			/* 优化后，不需要了
			if (divid == 'fv-valu') {
				// 以天天为基础合并
				var ttfunds = fd.funds['tt'];
				for (var key in ttfunds) {
					//console.log(key);
					try {
						ttfunds[key].curValue = fd.funds['thsfi'][key].curValue;
						ttfunds[key].curValueRate = fd.funds['thsfi'][key].curValueRate;
						ttfunds[key].curDate = fd.funds['thsfi'][key].curDate;
						ttfunds[key].jsonFundInfo = fd.funds['thsfi'][key].jsonFundInfo;
					} catch (e) {
						console.log(e.message);
					}
					try {
						ttfunds[key].preValue = fd.funds['ths'][key].preValue;
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

					//console.log(ttfunds[key]);
				}
				fd.funds = ttfunds;
			}
			*/

			// 回调处理函数
			func(divid);
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
		}, 8000);
	};

	/**
	 * 获得基金的估值,以天天基金为基础。
	 *
	 */
	fd.getFundValuation = function(fundlist) {
		var fcodes = fundlist.split(',');
		count = 0;
		tcount = 3 + fcodes.length;

		// 初始化fd.funds.为了同步数据。
		var funds = {};
		fd.funds = funds;
		for (var i = 0; i < fcodes.length; i++) {
			funds[fcodes[i]] = new fd.FundInfo();
		}

		// 天天基金估值
		for (var i = 0; i < fcodes.length; i++) {
			mui.get(ttValuationUrl + fcodes[i], '', function(script) {
				console.log("天天基金:" + script);
				var fval = JSON.parse(script.substring(2, script.length - 2)); // 参数cb=a
				if (fval && fval.fundcode) {
					var finfo = funds[fval.fundcode]; // 不能用fcodes[i]，i已经是循环之后的数了。
					finfo.code = fval.fundcode;
					finfo.name = fval.name;
					//finfo.curValue = fval.dwjz;
					//finfo.curDate = fval.jzrq;
					finfo.valuateDate = fval.gztime;
					finfo.ttValuation = fval.gsz;
					finfo.ttValuationRate = fval.gszzl;
				}
				count++;
			}, ''); // script还要试
		}

		// 同花顺获得基金信息
		mui.get(fundInfoUrl + fundlist, '', function(jsonData) {
			console.log("同花顺fi:" + JSON.stringify(jsonData));
			for (var i = 0; i < fcodes.length; i++) {
				var fval = jsonData.data[i];
				if (fval && fval.code) {
					var finfo = funds[fval.code];
					finfo.curValue = fval.net;
					finfo.curValueRate = fval.rate;
					finfo.curDate = fval.enddate;
					finfo.jsonFundInfo = fval;
				}
			}

			count++;
		}, 'json');

		// 同花顺估值
		mui.get(thsValuationUrl + fundlist, '', function(jsonData) {
			console.log("同花顺:" + JSON.stringify(jsonData));
			for (var i = 0; i < fcodes.length; i++) {
				var fval = jsonData.data[fcodes[i]]; // 这里用fcodes是因为json结构不同。
				if (fval && fval.pre) {
					var finfo = funds[fcodes[i]];
					finfo.preValue = fval.pre;
					finfo.thsValuation = fval.value;
					finfo.thsValuationRate = Math.round((fval.value - fval.pre) * 10000.0 / fval.pre) / 100.0;
				}
			}

			count++;
		}, 'json');

		// 好买网估值
		mui.get(hmValuationUrl + fundlist, '', function(jsonData) {
			console.log("好买网:" + JSON.stringify(jsonData));
			for (var i = 0; i < fcodes.length; i++) {
				var fval = jsonData[i];
				if (fval && fval.code) {
					var finfo = funds[fval.code];
					finfo.hmValuation = fval.valuation;
					finfo.hmValuationRate = fval.gzhb;
				}
			}

			count++;
		}, 'json');

		/* 不需要了
		fd.funds['tt'] = ttfunds;
		fd.funds['thsfi'] = thsfundinfos;
		fd.funds['ths'] = thsfunds;
		fd.funds['hm'] = hmfunds;
		*/
	};

	/**
	 * 获得基金的估值,以同花顺自选基金为基础。同步方式。
	 *
	 */
	fd.getFundValuationByUserID = function(userid) {
		var fundlist = '';
		count = 0;
		tcount = -1;

		// 同花顺估值
		mui.get(thsValuationByUserIDUrl + userid, '', function(jsonData) {
			//console.log("同花顺byid:" + JSON.stringify(jsonData));

			var fval, finfo;
			var funds = {};
			fd.fundsbyid = funds;
			for (var key1 in jsonData.data) { //kfs 开放式; cn 场内; hbx 货币. 数组.
				if (key1 == 'hbx') continue;
				var obj = jsonData.data[key1];
				for (var key2 in obj) {
					fval = obj[key2];
					if (fval && fval.code) {
						fundlist += ',' + fval.code;
						finfo = new fd.FundInfo();
						finfo.code = fval.code;
						finfo.name = fval.name;
						finfo.preValue = fval.net1;
						finfo.curValue = fval.net;
						finfo.curValueRate = fval.rate;
						finfo.curDate = fval.enddate;
						finfo.thsValuation = fval.estValue;
						finfo.thsValuationRate = fval.estRate;

						funds[finfo.code] = finfo;
					}
				}
			}

			fundlist = fundlist.substr(1); // 去掉最开始的','
			console.log(fundlist);
			if(!fundlist) { // 一般是错误的id
				tcount = 0;
				alert("未查到，可能是用户id错误！");
				return false;
			}
			
			var fcodes = fundlist.split(',');
			tcount = 1 + fcodes.length; // 加上好买网的一个


			//  好买网估值
			mui.get(hmValuationUrl + fundlist, '', function(jsonData) {
				//console.log("好买网byid:" + JSON.stringify(jsonData));
				for (var key in jsonData) {
					var fval = jsonData[key];
					finfo = funds[fval.code];
					finfo.hmValuation = fval.valuation;
					finfo.hmValuationRate = fval.gzhb;
					var d = new Date();
					finfo.valuateDate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + '  ' + fval.time;
				}

				count++;

			}, 'json');

			// 天天基金估值,只能单个取。要同步。有可能超时。
			for (var i = 0; i < fcodes.length; i++) {
				mui.get(ttValuationUrl + fcodes[i], '', function(script) {
					//console.log("天天基金byid:" + script);
					var fval = JSON.parse(script.substring(2, script.length - 2)) // 参数cb=a

					finfo = funds[fval.fundcode];
					finfo.ttValuation = fval.gsz;
					finfo.ttValuationRate = fval.gszzl;
					// finfo.valuateDate = fval.gztime;

					count++;

				}, ''); // script还要试
			}

		}, 'json');

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
			var fval = JSON.parse(script.substring(2, script.length - 2)); // 参数cb=a

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

	/**
	 * 填充基金估值数据DOM
	 */
	fd.setFVdom = function(divid) {
		console.log('setFVdom id:' + divid);

		var funds = {};
		if (divid == 'fv-valu') {
			funds = fdata.funds;
		} else if (divid == 'fv-ths') {
			funds = fdata.fundsbyid;
		}

		var div = document.getElementById(divid);
		var table = document.createElement('ul');
		table.className = 'mui-table-view';
		var li, subul, subli;
		// 插入数据DOM
		for (var key in funds) { // 按code排序了
			var fval = funds[key];
			//console.log(fval);
			li = document.createElement('li');
			li.className = 'mui-table-view-cell  mui-collapse';
			if (divid == 'fv-valu') {
				li.innerHTML = '<a class="mui-navigate-right" href="#">' + fval.code + ' | ' + fval.thsValuation + ' | ' + fval.thsValuationRate + '%</a>';
			} else {
				li.innerHTML = '<a class="mui-navigate-right" href="#" style="color:' + ((fval.curValueRate >= 0) ? 'red' : 'green') + '">' + fval.code + ' | ' + fval.curValue + ' | ' + fval.curValueRate + '%</a>';
			}
			subul = document.createElement('ul');
			subul.className = 'mui-collapse-content';
			//
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			subli.style.color = 'blue'; // 基金名称:
			subli.innerHTML = '<a href="http://z360.tk:8080/firstfund/fundpost.jsp?code=' + fval.code + '&class=0" target="_self">基金名称: ' + fval.name + '</a>';
			subul.appendChild(subli);
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			subli.innerHTML = '基金净值(上期): ' + fval.preValue;
			subul.appendChild(subli);
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			subli.style.color = (fval.thsValuationRate >= 0) ? 'red' : 'green';
			subli.innerHTML = '同花顺估值: ' + fval.thsValuation + '_' + fval.thsValuationRate + '%';
			subul.appendChild(subli);
			if (fval.ttValuation != 0) {
				subli = document.createElement('li');
				subli.className = 'mui-table-view-cell';
				subli.style.color = (fval.ttValuationRate >= 0) ? 'red' : 'green';
				subli.innerHTML = '天天基金估值: ' + fval.ttValuation + '_' + fval.ttValuationRate + '%';
				subul.appendChild(subli);
			}
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			subli.style.color = (fval.hmValuationRate >= 0) ? 'red' : 'green';
			subli.innerHTML = '好买网估值: ' + fval.hmValuation + '_' + fval.hmValuationRate + '%';
			subul.appendChild(subli);
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			subli.innerHTML = '估值时间: ' + fval.valuateDate;
			subul.appendChild(subli);
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			if (fval.curValueRate != -100) {
				subli.style.color = (fval.curValueRate >= 0) ? 'red' : 'green';
			}
			subli.innerHTML = '基金净值(最新): ' + fval.curValue + '_' + fval.curValueRate + '%';
			subul.appendChild(subli);
			subli = document.createElement('li');
			subli.className = 'mui-table-view-cell';
			subli.innerHTML = '最新净值时间: ' + fval.curDate;
			subul.appendChild(subli);
			//
			li.appendChild(subul);
			table.appendChild(li);
		}
		div.replaceChild(table, div.lastChild);
		if (divid == 'fv-valu') {
			mui('#pullrefresh-valu').pullRefresh().endPulldownToRefresh(); //refresh completed
		} else if (divid == 'fv-ths') {
			mui('#pullrefresh-ths').pullRefresh().endPulldownToRefresh(); //refresh completed
		}
	};

	/**
	 * 根据基金名，所持份额可以算出当日益利。
	 */
	fd.getFundAssets = function(funds) {

		mui.get(fundInfoUrl + (Object.keys(funds).join(',')), '', function(jsonData) {
			var totalProfit = 0;
			var thsfundinfos = {};
			for (var i = 0; i < Object.keys(funds).length; i++) {
				var fval = jsonData.data[i];
				if (fval && fval.code) {
					var finfo = new fdata.FundInfo();
					finfo.code = fval.code;
					finfo.name = fval.name;
					finfo.preValue = fval.net1;
					finfo.curValue = fval.net;
					finfo.curValueRate = fval.rate;
					finfo.curDate = fval.enddate;
					finfo.profit = funds[fval.code] * finfo.preValue * finfo.curValueRate / 100;
					//finfo.profit = funds[fval.code] * fval.ranges;  // 乘差值既可。但ranges不准。
					totalProfit += finfo.profit;
					thsfundinfos[fval.code] = finfo;
				}
				//console.log(finfo);
			}

			// 开始构造DOM
			var fragment = document.createDocumentFragment();
			var tr = document.createElement('tr');
			tr.innerHTML = '<td>日期</td><td>净值</td><td>涨跌幅</td><td>盈亏额</td>';
			fragment.appendChild(tr);
			for (var key in thsfundinfos) {
				var finfo = thsfundinfos[key];
				tr = document.createElement('tr');
				tr.innerHTML = '<td>' + finfo.code + '</td><td colspan="3">' + finfo.name + '</td>';
				fragment.appendChild(tr);
				tr = document.createElement('tr');
				tr.style.color = (finfo.profit >= 0) ? 'red' : 'green';
				tr.innerHTML = '<td>' + finfo.curDate + '</td><td>' + finfo.curValue + '</td><td>' + finfo.curValueRate + '%</td><td>' + Math.round(finfo.profit) + '</td>';
				fragment.appendChild(tr);
			}
			tr = document.createElement('tr');
			tr.innerHTML = '<td colspan="4"><hr></td>';
			fragment.appendChild(tr);
			tr = document.createElement('tr');
			tr.style.color = (totalProfit >= 0) ? 'red' : 'green';
			tr.innerHTML = '<td>当日盈利：</td><td colspan="3">' + Math.round(totalProfit) + '元。</td>';
			fragment.appendChild(tr);

			var table = document.getElementById('fv-assets');
			table.innerHTML = '';
			table.appendChild(fragment);

		}, 'json');

	}

	/**
	 * 获取实时指数报价
	 */
	fd.getIndexQuotes = function(indexs) {

		mui.get(indexQuoteUrl, '', function(jsonData) {
			var quotes = {};
			var datas = jsonData.data;
			for (var i = 0; i < datas.length; i++) {
				if (indexs.indexOf(datas[i].indexcode) >= 0) {
					quotes[datas[i].indexcode] = datas[i];
				}
			}

			var fragment = document.createDocumentFragment();
			var tr = document.createElement('tr');
			tr.innerHTML = '<td>指数名</td><td>最新价</td><td>涨跌额</td><td>涨跌幅</td>';
			fragment.appendChild(tr);
			for (var i = 0; i < indexs.length; i++) {
				var quote = quotes[indexs[i]];
				if (quote) {
					tr = document.createElement('tr');
					tr.style.color = (quote.zdf >= 0) ? 'red' : 'green';
					tr.innerHTML = '<td>' + (quote.indexname || quote.indexcode) + '</td><td>' + quote.zxj + '</td><td>' + quote.zde + '</td><td>' + quote.zdf + '%</td>';
					fragment.appendChild(tr);
				}
			}
			tr = document.createElement('tr');
			tr.innerHTML = '<td>更新时间</td><td colspan="3">' + jsonData.rtime + '</td>';
			fragment.appendChild(tr);

			var table = document.getElementById('fv-indexs');
			table.innerHTML = '';
			table.appendChild(fragment);

		}, 'json');

	}

	return fd;

})(document);