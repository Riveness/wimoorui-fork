import request from "@/utils/request.js";
import downloadhandler from "@/utils/download-handler.js";
function list(data){
	 return request.post('/amazon/api/v0/rpt/performance/coupon/list',data);
}
 
export default{ list,}