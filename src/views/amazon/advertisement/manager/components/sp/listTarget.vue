<template>
	<el-row>
		<el-space>
			<el-select v-model="adstate" placeholder="广告状态" @change="handleQuery"  >
				<el-option v-for="item in adStatesOptions" :label="item.name" :value="item.value"></el-option>
			</el-select>
			 <Datepicker ref="datepickersRef" :days="1" class="date-picker-width"   @changedate="changedate" />
			   <el-radio-group class="el-radio-group-button" v-model="times" @change="changeTimes(datepickersRef,times)">
			      <el-radio-button label="昨天" />
			      <el-radio-button label="近7天" />
			      <el-radio-button label="近30天" />
			    </el-radio-group>
			<el-input v-model="queryParams.search" @input="handleQuery" placeholder="搜索商品投放">
					 <template #suffix>
					  <el-icon @click.stop="handleQuery"><Search /></el-icon>
					 </template>
			</el-input>	
			<el-button @click="clearSearch">重置</el-button>
			<DataFilter :activeName="activeName"  @change="changeDataFilter"/>
		</el-space>
	</el-row>
	<el-row class="flex-center-between">
		<el-space>
		 
		<el-button    :disabled="!queryParams.adGroupid" title="请先锁定广告组再添加" type="primary"  class="im-but-one" @click="handleAdd()">
		  <plus theme="outline" size="18" fill="#fff" :strokeWidth="4"/>
		  <span>添加商品投放</span>
		</el-button>
		<el-dropdown trigger="click">
		  <el-button :disabled="disabled">
		             批量操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
		  </el-button>
		  <template #dropdown>
		    <el-dropdown-menu >
		      <el-dropdown-item  @click="handleValue('bid','调整投放竞价')">调整投放竞价</el-dropdown-item>
			  <el-dropdown-item  @click="copySelectRows">复制到粘贴板</el-dropdown-item>
			  <el-dropdown-item  @click="handleUpdate(globalTable,state,'status','ENABLED')">启用</el-dropdown-item>
			  <el-dropdown-item  @click="handleUpdate(globalTable,state,'status','PAUSED')">暂停</el-dropdown-item>
			  <el-dropdown-item  >备注</el-dropdown-item>
		    </el-dropdown-menu>
		  </template>
		</el-dropdown>
		<el-space v-show="batch.input">
			<el-button @click="batch.input=false">取消</el-button>
			<el-text class="font-base">{{batch.text}}</el-text>
			<el-input v-if="batch.type=='bid'" v-model="batch.value"></el-input>
			 
			<el-button type="primary" @click.stop="handleUpdate(globalTable,state,batch.type,batch.value)">确认</el-button>
		</el-space>
		</el-space>
		<div class='icon-group'>
			<el-space>
			<el-dropdown  >
			    <el-button class='ic-btn'  title='其他'>
			      <el-icon><Menu /></el-icon>
			    </el-button>
			    <template #dropdown>
			      <el-dropdown-menu>
			        <el-dropdown-item   @click="handleExpendAdContent('days')">广告成交周期</el-dropdown-item>
			      </el-dropdown-menu>
			    </template>
			  </el-dropdown>
			  <el-button   @click="showAdChart(adchartRef,state)" class='ic-btn'  title='展示图表'>
			   <el-icon><Histogram /></el-icon>
			  </el-button>
			  <el-tooltip content="自定义列"   placement="top">
			  	<el-button   @click="showColumnSet(columnSetRef,'advtargets')" class='ic-btn'>
			  <el-icon><Tools /></el-icon>
			  </el-button>
			  </el-tooltip>
			</el-space>
		</div>
	</el-row>
 <div class="summary-top expend-table" v-loading="selectionloding">
	 <GlobalTable  ref="globalTable" :tableData="tableData"
	   @loadTable="loadTableData" :stripe="false" 
	   @selectionChange = "selectChange"
	   :defaultSort="defaultSort"
	   show-summary
	   :lazy="false"
	   :load="handleExpend"
	   :treeProps="{ children: 'children', hasChildren: 'hasChildren' }"
	   :summary-method="getSummaries"
	    rowKey="id"
	   :defaultExpandAll="true"
	   fieldType="advtargets"
	   >
		  <template v-slot:field='columns'>
		 <el-table-column  fixed type="selection" width="60" />
		  <el-table-column fixed    label="商品投放"  width="240"  >
		  			 <template #default="scope">
						   <div v-if="scope.row.status!='none'">
							<div  class='name' v-html="targetnameFormatter(scope.row)"></div>
						  </div>
						  <div v-else>
								<div  class='name'>{{scope.row.name}}</div>
						  </div>
					   </template>
		  </el-table-column>
		   <el-table-column    label="状态"  >
			   <template #default="scope">
				   <div >
				    <el-switch   v-if="scope.row.status?.toUpperCase()=='ARCHIVED'" disabled
				       v-model="scope.row.checkstatus"
					    inline-prompt
						width="45px"
					   active-text="开启"
					   inactive-text="归档"
				       size="small"
				     />
					 <el-switch :loading="scope.row.statusloading" v-else-if="scope.row.status?.toUpperCase()=='ENABLED' || scope.row.status?.toUpperCase()=='PAUSED'"  
					    v-model="scope.row.checkstatus"
						 inline-prompt
						 width="45px"
						active-text="开启"
						inactive-text="暂停"
					    size="small"
						 @change="handleSubmitUpdate(state,'status',scope.row)"
					  />
					  <span v-else></span>
					  </div>
					   <el-button link  size="small" v-if="scope.row.servingStatus&&scope.row.servingStatus=='loading'" :loading="true"></el-button>
					   <div v-else>
						    <span  style="font-size:10px;" v-if="scope.row?.servingStatus&&scope.row?.servingStatus?.show" :class="'text-'+scope.row?.servingStatus?.color" :title="scope.row?.servingStatus?.title">{{scope.row?.servingStatus?.name}}</span>
					   </div>
					   
			   </template>
			</el-table-column>
		 
		 <template v-if="columns.list" v-for="column in columns.list">
		 	<el-table-column   :label="column.label" :width="column.width " :sortable="column.sortable?'custom':false" :prop="column.prop">
		 		<template #default="scope">
		 			   <div v-if="column.prop=='campaignName'">
		 				 <span v-if="scope.row.status=='none'&& !scope.row.statustype"  style="font-size: 12px;"  >
		 				   <span  ></span>
		 				 </span>
							   <el-link v-else :underline="false" type="primary">
							   <span @click.stop="bindAdvCams(scope.row.campaignId,scope.row.campaignName)" v-if="scope.row.campaignName">
								   {{scope.row.campaignName}}
							   </span>
							   <span v-else>
								   <span >{{scope.row.name}}</span>
							   </span>
							   </el-link>
							  <copy class="" @click.stop="CopyText(scope.row.campaignName)" title='复制广告活动' theme="outline" size="14" fill="#666" :strokeWidth="3"/>
		 			   </div>
		 				<div v-else-if="column.prop=='adGroupName'">
		 					<span v-if="scope.row.status=='none'&& !scope.row.statustype"  style="font-size: 12px;"  >
									  <span  ></span>
								   </span>
							   <el-link v-else :underline="false" type="primary">
							   <span v-if="scope.row.adGroupName"  
										   @click.stop="bindAdvGpds(scope.row.adGroupId,scope.row.adGroupName,scope.row.campaignId,scope.row.campaignName)">
								   {{scope.row.adGroupName}}
							   </span>
							   <span v-else>
									 <span >{{scope.row.name}}</span>
							   </span>
							   </el-link>
								<copy class="" @click.stop="CopyText(scope.row.adGroupName)" title='复制广告组' theme="outline" size="14" fill="#666" :strokeWidth="3"/>
		 				</div>
		 				<div v-else-if="column.prop=='expressionType'">
		 				  <span v-if="scope.row.expressionType=='manual' || scope.row.expressionType=='MANUAL'">手动</span>
		 				  <span v-else-if="scope.row.expressionType=='auto' || scope.row.expressionType=='AUTO'">自动</span>
		 				  <span v-else></span>
		 				</div>
		 				<div v-else-if="column.prop=='bid'">
		 				   <div>
		 				    {{scope.row.bid}}
		 				   <span class="table-edit-flex" style="float:right;margin-top:4px;"
		 				    @click.stop="showBidModal(scope.row)"> <el-icon  ><Edit/></el-icon>
		 				   </span>
		 				   </div>
		 				   <el-button v-if="scope.row.suggestedBid=='loading'"   :loading="true" size="small" link></el-button>
		 				   <div v-else title="建议竞价" class="font-extraSmall"><span v-if="scope.row.suggestedBid&& scope.row.suggestedBid.suggested">{{scope.row.suggestedBid.suggested}}({{scope.row.suggestedBid.rangeStart}}-{{scope.row.suggestedBid.rangeEnd}})</span> </div>
		 				</div>
		 				<div v-else>
		 					  {{scope.row[column.prop]}}
		 				</div>
		 		  </template>
		 	</el-table-column>
		 </template>
			<!-- <el-table-column    label="广告活动"  width="200" >
				   <template #default="scope">
					   <span v-if="scope.row.status=='none'&& !scope.row.statustype"  style="font-size: 12px;"  >
					     <span  ></span>
					   </span>
						   <el-link v-else :underline="false" type="primary">
						   <span @click.stop="bindAdvCams(scope.row.campaignId,scope.row.campaignName)" v-if="scope.row.campaignName">
							   {{scope.row.campaignName}}
						   </span>
						   <span v-else>
							   <span >{{scope.row.name}}</span>
						   </span>
						   </el-link>
						  <copy class="" @click.stop="CopyText(scope.row.campaignName)" title='复制广告活动' theme="outline" size="14" fill="#666" :strokeWidth="3"/>
				   </template>
			 </el-table-column>
			 <el-table-column     label="广告组"  width="200" >
			 	   <template #default="scope">
			 		   <span v-if="scope.row.status=='none'&& !scope.row.statustype"  style="font-size: 12px;"  >
			 						  <span  ></span>
			 					   </span>
			 				   <el-link v-else :underline="false" type="primary">
			 				   <span v-if="scope.row.adGroupName"  
			 							   @click.stop="bindAdvGpds(scope.row.adGroupId,scope.row.adGroupName,scope.row.campaignId,scope.row.campaignName)">
			 					   {{scope.row.adGroupName}}
			 				   </span>
							   <span v-else>
							   		 <span >{{scope.row.name}}</span>
							   </span>
			 				   </el-link>
								<copy class="" @click.stop="CopyText(scope.row.adGroupName)" title='复制广告组' theme="outline" size="14" fill="#666" :strokeWidth="3"/>
			 	   </template>
			 				   
			  </el-table-column>
			<el-table-column     label="匹配类型"  width="200" >
				   <template #default="scope">
						<span v-if="scope.row.expressionType=='manual' || scope.row.expressionType=='MANUAL'">手动</span>
						<span v-else-if="scope.row.expressionType=='auto' || scope.row.expressionType=='AUTO'">自动</span>
						<span v-else></span>
				   </template>
			 </el-table-column> -->
			 
			<!-- <el-table-column     label="建议竞价"  width="200" >
			 	   <template #default="scope">
					    <span class="font-extraSmall" v-html="adgroupsuggestFormatter(scope.row)"></span>
			 	   </template>
			  </el-table-column>  -->
			 <!-- <el-table-column     label="投放竞价"  width="120" >
			  	   <template #default="scope">
					   <div>
			  		  {{scope.row.bid}}
					 <span class="table-edit-flex" style="float:right;margin-top:4px;"
					  @click.stop="showBidModal(scope.row)"> <el-icon  ><Edit/></el-icon>
					 </span>
					 </div>
					 <el-button v-if="scope.row.suggestedBid=='loading'"   :loading="true" size="small" link></el-button>
					 <div v-else title="建议竞价" class="font-extraSmall"><span v-if="scope.row.suggestedBid&& scope.row.suggestedBid.suggested">{{scope.row.suggestedBid.suggested}}({{scope.row.suggestedBid.rangeStart}}-{{scope.row.suggestedBid.rangeEnd}})</span> </div>
			  	   </template>
			   </el-table-column>
			<el-table-column   label="曝光量" width="140 " sortable="custom"   prop="impressions"/>
			<el-table-column   label="点击次数" width="130 " sortable="custom"   prop="clicks"/>
			<el-table-column   label="点击率" width="130 " sortable="custom"  prop="CTR" />
			<el-table-column   label="每次点击费用" width="130" sortable="custom"   prop="avgcost"/>
			<el-table-column   label="广告费"  width="130 " sortable="custom"  prop="cost"/>
			<el-table-column   label="广告销售额" width="130 " sortable="custom"    prop="sumSales" />
			<el-table-column   label="销量" width="130 " sortable="custom"  prop="sumUnits" />
			<el-table-column   label="订单量" width="130 " sortable="custom" prop="attributedUnitsOrdered" />
			<el-table-column   label="Acos" width="140 " sortable="custom"    prop="ACOS"/>
			<el-table-column   label="RoAS" width="120 " sortable="custom"  prop="ROAS"/>
			<el-table-column   label="转化率" width="120 "  prop="CSRT"/>
			<el-table-column   label="目标商品-销售额" sortable="custom"  width="180 "  prop="attributedSalesSameSKU"/>
			<el-table-column   label="其它商品-销售额" sortable="custom"  width="180 "  prop="attributedSales"/>
			<el-table-column   label="目标商品-转化量" sortable="custom"  width="160"   prop="attributedConversionsSameSKU"/>
			<el-table-column   label="其它商品-转化量" sortable="custom"  width="160"   prop="attributedConversions"/> -->
	 </template>
	 </GlobalTable>
 </div>
  <columnSet ref="columnSetRef"  @change="getFieldData" />
 <SchedulePlan  ref="scheduleRef" />
 <BiddingDialog ref="biddingRef" @change="loadList(state)"/>
 
 
	<el-dialog
	title="投放竞价设置"
	v-model="bidVisible"
	width="60%"
	>
	<div v-loading="bidloading">
	 <el-input v-model="editRow.bid"></el-input>
	 </div>
	 <div style="margin-top: 15px;" v-if="editRow.suggestedBid">
		 建议竞价:{{editRow.suggestedBid.suggested}},竞价范围:{{editRow.suggestedBid.rangeStart}}-{{editRow.suggestedBid.rangeEnd}}
	 </div>
	 <div style="margin-top: 15px;" v-else>
	 	  建议竞价加载中......
	 </div>
	<template #footer>
		<el-button @click="bidVisible=false">取消</el-button>
		<el-button type="primary" @click="handleSubmitUpdate(state,'bid',editRow)"  >确认</el-button>
	</template>
	</el-dialog>
	<AdChart ref="adchartRef" :summary="summary" />
</template>

<script setup>
	import {ref,reactive,onMounted,watch,toRefs,computed} from 'vue';
	import {ElMessage,ElDivider} from 'element-plus';
	import {Search,ArrowDown,Menu,Edit,Histogram,WarningFilled,Close,Tools} from '@element-plus/icons-vue';
	import {Copy} from '@icon-park/vue-next';
	import CopyText from"@/utils/copy_text.js";
	import columnSet from '@/components/Table/column_set.vue';
	import AdOrderCycle from '@/views/amazon/advertisement/manager/components/common/ad_order_cycle.vue';
	import Datepicker from '@/components/header/datepicker.vue';
	import filtericon from "@/components/icon/filtericon.vue";
	import Category from '@/components/header/category.vue';
	import AdChart from '@/views/amazon/advertisement/manager/components/common/ad_chart.vue';
	import DataFilter from '@/views/amazon/advertisement/manager/components/common/data_filter.vue';
	import {handleSubmitUpdate,loadList,handleUpdate,handleExpandChange,loadSuggestedTargets} from '../javascript/target.js';
	import {showAdChart,handleAdvDaysData,changeTimes,showColumnSet} from '../javascript/common.js';
	import {targetnameFormatter,} from '../javascript/formatter.js';
	import {dateFormat,formatFloat,getValue,formatPercent} from '@/utils/index.js';
	import { useRoute,useRouter } from 'vue-router';
	let router = useRouter();
	const columnSetRef = ref();
	const endtimeRef = ref()
	const budgetRefRef = ref()
	const biddingRef = ref()
	const globalTable =ref()
	const scheduleRef = ref()
	const datepickersRef=ref();
	const categoryRef=ref();
	const nameRefRef =ref();
	const adchartRef=ref();
	let props = defineProps({ activeName:"" })
	const { activeName } = toRefs(props);
	const state = reactive({
		nameVisible:false,
		editRow:{bid:''},
		tableData:{records:[
		],total:0},
		summary:{},
		times:'近7天',
		expandType:"",
		queryParams:{},
		batch:{text:'',input:false,value:'',},
		emits:null,
		defaultSort:{ prop: 'expression', order: 'ascending' },
		bindParams:{},
		adStatesOptions:[
				{name:'全部广告状态',value:'all',},
				{name:'已启动',value:'enabled',},
				{name:'已暂停',value:'paused',},
				{name:'已归档',value:'archived',},
				// {name:'运行中',value:'runing',},
				// {name:'停止中',value:'stoping',},
			],
		adstate:'all',
		selectionloding:false,
		bidVisible:false,
		bidloading:false,
	})
	const{
		tableData,
		editRow,
		batch,
		times,
		summary,
		expandType,
		queryParams,
		defaultSort,
		bindParams,
		adStatesOptions,
		adstate,
		selectionloding,
		bidVisible,
		bidloading,
	}=toRefs(state)
	const emits = defineEmits(['selectRow','change','bindData']);
	state.emits=emits;
	
	function showOrderby(row){
		//展示图表
	}
	function showBidModal(row){
		//加载建议竞价数据
		state.bidVisible=true;
		state.editRow=row;
		state.editRow.bid = row.bid;
		loadSuggestedTargets(state.editRow,"sp");
	}
	function changedate(dates,val,type){
			state.queryParams.fromDate=dates.start;
			state.queryParams.endDate=dates.end;
			if(type!="load"){
				handleQuery();
			}
	}
	function changeDataFilter(paralist){
		if(paralist!="" && paralist!=undefined && paralist!=null){
			state.queryParams.paralist=paralist;
			handleQuery();
		}else{
			state.queryParams.paralist=null;
			handleQuery();
		}
	}
	function clearSearch(){
		state.adstate='all';
		state.adType='all';
		state.queryParams.search='';
		state.bindParams={};
		state.queryParams.changeRate='';
		state.queryParams.categoryid='';
		state.queryParams.skuStr=null;
		if(categoryRef.value){
			categoryRef.value.reset();
		}
		handleQuery();
	}

	onMounted(()=>{
		//加载汇总数值
	
	});
	function handleAdd(){
		router.push({
			path:"/a/a/sp",
			query:{
				title:'添加商品投放',
				path:"/a/a/sp",
				type:state.activeName,
				campaignid:state.queryParams.campaignid,
				adGroupid:state.queryParams.adGroupid
			},
		})
	}
	function bindAdvCams(id,name){
		state.bindParams.campaignid=id;
		state.bindParams.camname=name;
		state.bindParams.adgroupid=null;
		state.bindParams.adgroupname=null;
		emits("bindData",state.bindParams);
	}
	function bindAdvGpds(adid,adname,camid,camname){
		state.bindParams.campaignid=camid;
		state.bindParams.camname=camname;
		state.bindParams.adgroupid=adid;
		state.bindParams.adgroupname=adname;
		emits("bindData",state.bindParams);
	}
	 
	function selectChange(seletion){
		emits('selectRow',seletion)
	}
	 
	function handleExpend(row,treeNode,resolve){
		handleExpandChange(state,row,treeNode,resolve)
	}
	 
	function handleExpendAdContent(ftype){
		if(ftype=="days"){
			//广告成交周期展开
			state.expandType="days";
		} 
		var records=JSON.parse(JSON.stringify(state.tableData.records)); 
		records.forEach(item=>{
			handleExpandChange(state,item);
		});
		state.tableData.records=[];
		var time=setTimeout(function(){
			state.tableData.records=records;
			clearTimeout(time);
		},1000);
		
	 
	}
	
 
	function loadTableData(params){
		if(params&&params.profileid){
			state.queryParams=params;
			loadList(state);
		}
	}
	function handleQuery(){
		state.bidVisible=false;
		if(state.queryParams.profileid){
			if(state.adstate=='all'){
				state.queryParams.state=null;
			}else{
				state.queryParams.state=state.adstate;
			}
			state.queryParams.targetingType=state.adType;
		    state.queryParams.search=state.queryParams.search;
			 globalTable.value.loadTable(state.queryParams);
		}
	   
	}
	function getSummaries({columns,data}){
		var arr = ["合计"];
				columns.forEach((item,index)=>{
					if(index>=6){
						arr[index]=state.summary[item.property];
					}
				})
		return  arr
	}
	 function getFieldData(fdata){
	 	loadField(fdata);
	 }
	 function loadField(id){
	 	globalTable.value.refreshField();
	 }
	 
	 function show(params){
		 state.queryParams=Object.assign(state.queryParams, params);
		 state.activeName=props.activeName;
		 var timer=setTimeout(function(){
		 			 handleQuery();
					  loadField();
		 			 clearTimeout(timer);
		 },100);
	 }
	 function changeCategory(val){
	 	state.queryParams.categoryid=val;
	 }
	 function handleValue(type,name){
	 	state.batch.input = true;
	 	state.batch.text = name;
		state.batch.type=type;
	 }
	 function copySelectRows(){
		 var names="";
		 var rows=globalTable.value.getSelectionRows();
		 if(rows && rows.length>0){
			 rows.forEach(item=>{
				  if(item.expressionType.toUpperCase()=="AUTO"){
					  var exp=JSON.parse(item.expression);
					  names=names+exp[0].type+"\n";
				  }else{
					   names=names+item.targetingText+"\n";
				  }
				
			 });
		 }
		 CopyText(names);
	 }
	defineExpose({
		handleQuery,show,
	})
</script>

<style>
.popover-footer{
	margin-top:16px;
}
 .summary-top .el-table__body-wrapper {
  order: 1;
}
</style>