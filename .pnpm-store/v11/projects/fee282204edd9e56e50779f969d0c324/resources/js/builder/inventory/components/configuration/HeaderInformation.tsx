import LockScrollButton from "../utils/LockScrollButton";
import {useRef, useState} from "react";
import InformationModal from "../modals/InformationModal";

const HeaderInformation = ({needToUpdate, saveData, onDownload, onImport}) => {

    const [showModal, setShowModal] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) onImport(file);
        event.target.value = '';
    };

    return (
        <div className={"header-information"}>
            <div className={"card rounded-1"}>
                <div className={"card-body d-flex justify-content-between"}>
                    <div className={needToUpdate ? 'enable' : 'disable'} onClick={saveData}>
                        <i className="bi bi-floppy"></i>
                        <span className={"ms-1"}>保存</span>
                    </div>
                    <button type="button" className={'enable action border-0 bg-transparent'} onClick={onDownload}>
                        <i className="bi bi-cloud-download"></i>
                        <span className={"ms-1"}>导出</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept=".yml,.yaml,text/yaml,application/x-yaml" hidden onChange={handleFileChange}/>
                    <button type="button" className={'enable action border-0 bg-transparent'} onClick={() => fileInputRef.current?.click()}>
                        <i className="bi bi-file-earmark-arrow-up"></i>
                        <span className={"ms-1"}>导入</span>
                    </button>
                    <LockScrollButton/>
                    <span className={'action'} onClick={() => setShowModal(true)}>
                        <i className="bi bi-info-lg"></i> 操作说明
                    </span>
                    <InformationModal handleClose={() => setShowModal(false)} show={showModal}/>
                </div>
            </div>
        </div>
    )

}

export default HeaderInformation
