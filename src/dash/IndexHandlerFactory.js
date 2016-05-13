import SegmentBaseHandler from './SegmentBaseHandler.js';
import SegmentTemplateHandler from './SegmentTemplateHandler.js';
import SegmentListHandler from './SegmentListHandler.js';
import DashDriver from './DashDriver.js';

class IndexHandlerFactory {

    static create (type) {
        if (DashDriver.hasSegmentBase(type)) {
            console.log("hasSegmentBase");
            return new SegmentBaseHandler(type);
        } else if (DashDriver.hasSegmentTemplate(type)) {
            console.log("hasSegmentTemplate");
            return new SegmentTemplateHandler(type);
        } else if (DashDriver.hasSegmentList(type)) {
            console.log("hasSegmentList");
            return new SegmentListHandler(type);
        } else {
            throw "Unknown or unsupported segment type";
        }
    }

}

export default IndexHandlerFactory;