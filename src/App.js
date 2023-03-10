import React, {useState} from 'react';
import './App.css';

import { Layout, Row, Col, Form, Radio, ConfigProvider, Select, Space, Slider, InputNumber } from 'antd';
const { Option } = Select;
const { Header, Footer, Sider, Content } = Layout;
import 'antd/dist/reset.css';
import {SisternodeOutlined} from '@ant-design/icons';


import View from "./Components/View";
import OriginCircuit from "./Components/OriginCircuit";
import Dandelion from "./Components/Dandelion";




const HEADER_HEIGHT = 60, WHOLE_MARGIN_LR = 100


//整体布局的CSS代码放在这里，其余的细节的样式放在 App.css 里面
const root_comp_style = {
    "headerStyle": {
        width: '100%',
        color: '#ffffff',
        height: `${HEADER_HEIGHT}px`,
        lineHeight: `${HEADER_HEIGHT-10}px`,
        backgroundColor: '#333b3e',
        paddingTop: '10px',
        paddingBottom: '10px',
        marginBottom: '20px',
        // paddingInline: WHOLE_MARGIN_LR
    },


    "contentStyle": {
        height: "100%",
        border: "solid 1px #515962",
        borderRadius: "12px",
        padding: "15px"
    }
}



function App() {


    // 控制 选择的算法
    const [param_algo, setAlgo] = useState('example')



    function handleValueChange(event){

        // setAlgo(event.target.value)
        setAlgo(event)

    }







    return (

        <ConfigProvider theme={{ hashed: false }}>


            <Layout style={{ height: "100%"}}>
                <Content style={root_comp_style.contentStyle}>
                    <Header style={root_comp_style.headerStyle}>
                        <div style={{width: "100%"}}>
                            <SisternodeOutlined  style={{fontSize: '2.5em'}}/>
                            <span className="system-title">XQC-System</span>
                            <span className="paper-title">The tile of this paper / Die Fliese dieses Papiers</span>
                        </div>

                    </Header>

                    {/* control panel*/}
                    <Row  justify="center">
                        <Col style={{width: '98%'}}>
                            <div className={'component control_panel'}>

                                <Form size={'large'} layout={'inline'}>

                                    <Form.Item style={{paddingLeft: '30px', marginRight: '30px'}}>
                                        <i className="fas fa-pen view_title_icon" style={{fontSize: '1.5em'}}/>
                                        <span className={'view_title_text'} style={{fontSize: '1.8em'}}> Control panel </span>
                                    </Form.Item>


                                    <Space size={200}>


                                        <Form.Item label="Algo selection">
                                            <Select placeholder="Please select an algorithm"
                                                    defaultValue={param_algo}
                                                    onChange={handleValueChange}
                                            >
                                                <Option value="example">example</Option>
                                                <Option value="usa">example2</Option>
                                            </Select>
                                        </Form.Item>



                                        <Form.Item label="Form Layout"  >
                                            <Radio.Group>
                                                <Radio.Button value="horizontal">Horizontal</Radio.Button>
                                                <Radio.Button value="vertical">Vertical</Radio.Button>
                                                <Radio.Button value="inline">Inline</Radio.Button>
                                            </Radio.Group>
                                        </Form.Item>


                                        <Form.Item label="Circle radius:" style={{width: '300px'}}>
                                            <Row>


                                                <Col span={21}>
                                                    <Slider
                                                        range
                                                        step={0.01}
                                                        min={0}
                                                        max={20}

                                                        // defaultValue={[0, 0]}
                                                        // min={this.state.view2_qual_extent[0]}
                                                        // max={this.state.view2_qual_extent[1]}
                                                        // onAfterChange={this.view2_gate_qual_filter}
                                                        // disabled={check1()}
                                                    />
                                                </Col>
                                                <Col span={3}>
                                                    <InputNumber
                                                        /*min={1}
                                                        max={20}*/
                                                        // value={this.state.view2_gate_qual_filter[1]}
                                                        // controls={false}
                                                        // style={{width: '80%'}}
                                                    />
                                                </Col>

                                            </Row>

                                        </Form.Item>


                                    </Space>
                                </Form>

                            </div>
                        </Col>
                    </Row>


                    {/* View 层*/}
                    <Row  gutter={0} justify="space-around" style={{height: "82%"}}>


                            <Col span={16}>

                                <Row gutter={30}  justify="center" style={{height: "75%", marginBottom: '20px'}}>
                                    <div className={'component'} style={{width: '95%', height: "100%"}}>

                                        <View param_algo={param_algo}></View>

                                    </div>
                                </Row>


                                <Row gutter={30}  justify="center" style={{height: "20%"}}>
                                    <div className={'component'} style={{width: '95%', height: "100%"}}>

                                        <OriginCircuit></OriginCircuit>

                                    </div>
                                </Row>

                            </Col>










                        <Col  className="gutter-row" span={8}>
                            <div className={'component'} style={{height: "100%"}}>

                                <Dandelion></Dandelion>

                            </div>
                        </Col>
                    </Row>

                </Content>
            </Layout>


        </ConfigProvider>





  );
}

export default App;
