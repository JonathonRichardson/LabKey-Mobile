/*
 * Copyright (c) 2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.labkey.labkey_mobile;

import org.labkey.api.action.SimpleViewAction;
import org.labkey.api.action.SpringActionController;
import org.labkey.api.security.ActionNames;
import org.labkey.api.security.RequiresPermission;
import org.labkey.api.security.RequiresLogin;
import org.labkey.api.security.permissions.ReadPermission;
import org.labkey.api.view.JspView;
import org.labkey.api.view.NavTree;
import org.labkey.api.view.ViewContext;
import org.labkey.api.view.WebPartView;
import org.labkey.api.view.template.ClientDependency;
import org.springframework.validation.BindException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.Controller;
import org.labkey.api.view.template.PageConfig;

public class labkey_mobileController extends SpringActionController
{
    private static final DefaultActionResolver _actionResolver = new DefaultActionResolver(labkey_mobileController.class);
    public static final String NAME = "labkey_mobile";

    public labkey_mobileController()
    {
        setActionResolver(_actionResolver);
    }

    @RequiresPermission(ReadPermission.class)
    public class BeginAction extends SimpleViewAction
    {
        public ModelAndView getView(Object o, BindException errors) throws Exception
        {
            return new JspView("/org/labkey/labkey_mobile/view/hello.jsp");
        }

        public NavTree appendNavTrail(NavTree root)
        {
            return root;
        }
    }

    @ActionNames("LABKEYJavascriptAPI")
    @RequiresLogin
    public class MinAction<FORM> extends SimpleViewAction<FORM> {
        @Override
        public NavTree appendNavTrail(NavTree root) {
            return root;
        }   

        public ModelAndView getView(FORM form, BindException errors) throws Exception
        {   
            JspView view = new JspView("/org/labkey/labkey_mobile/minTemplate.jsp");
            //view.addClientDependency(ClientDependency.fromPath("/wnprc_ehr/c3"));
            view.setFrame(WebPartView.FrameType.NONE);
            return view;
        }   
    }  

    /*
     * Override the template function here so we can choose any template that we want.
     */
    @Override
    protected ModelAndView getTemplate(ViewContext context, ModelAndView mv, Controller action, PageConfig page) {
        JspView<PageConfig> template = new JspView<PageConfig>("/org/labkey/labkey_mobile/minTemplate.jsp", page);
        template.setBody(mv);
        template.setFrame(WebPartView.FrameType.NONE);
        return template;
    }
}
