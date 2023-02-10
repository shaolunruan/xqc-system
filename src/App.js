import React, {useState} from 'react';
import './App.css';

import { Layout, Row, Col } from 'antd';
const { Header, Footer, Sider, Content } = Layout;
import 'antd/dist/reset.css';
import {SisternodeOutlined} from '@ant-design/icons';


import Try from "./Components/try";
import View from "./Components/View";





const HEADER_HEIGHT = "44px", WHOLE_MARGIN_LR = 100


//整体布局的CSS代码放在这里，其余的细节的样式放在 App.css 里面
const root_comp_style = {
    "headerStyle": {  color: '#ffffff',  height: HEADER_HEIGHT, lineHeight: HEADER_HEIGHT, display:'flex',  inlineHeight: HEADER_HEIGHT, backgroundColor: '#333b3e',paddingInline: WHOLE_MARGIN_LR},


    "contentStyle": {height: "100%", border: "solid 1px #515962", margin: `20px ${WHOLE_MARGIN_LR}px`, borderRadius: "12px", padding: "15px"}
}



function App() {


    const [value, setValue] = useState(1)



    function handleValueChange(event){

        setValue(+event.target.value)
    }







    return (
      <Layout style={{ height: "100%"}}>
          <Header style={root_comp_style.headerStyle}>
            <div style={{width: "100%"}}>
                <SisternodeOutlined  style={{fontSize: '2.2em', top: '7px', position: 'absolute'}}/>
                <span className="system-title">XQC-System</span>
                <span className="paper-title">The tile of this paper / Die Fliese dieses Papiers</span>
            </div>

          </Header>
          <Content style={root_comp_style.contentStyle}>
              <Row gutter={16}  justify="center" style={{height: "100%"}}>
                  <Col span={19}>
                      <div className={'component'}>

                        {/*<Try param={value}/>*/}
                        <View></View>

                      </div>
                  </Col>
                  <Col span={5}>
                      <div className={'component'}>

                          <input value={value} onChange={handleValueChange}/>
                          {/*<button onClick={click}>click to change</button>*/}


                      </div>
                  </Col>
              </Row>

          </Content>
      </Layout>





  );
}

export default App;
